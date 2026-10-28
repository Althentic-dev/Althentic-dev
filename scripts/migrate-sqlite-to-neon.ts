/// <reference types="bun-types" />

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { Database } from "bun:sqlite";
import { Prisma, PrismaClient } from "@prisma/client";
import { getReceiptObject, putReceiptObject } from "../src/lib/server/neon-storage";

type Row = Record<string, unknown>;
type DmmfModel = (typeof Prisma.dmmf.datamodel.models)[number];
type DataDelegate = {
  count(): Promise<number>;
  createMany(args: { data: Row[] }): Promise<{ count: number }>;
};

class MigrationError extends Error {}

function delegate(client: unknown, model: DmmfModel): DataDelegate {
  const name = model.name[0].toLowerCase() + model.name.slice(1);
  const value = (client as Record<string, unknown>)[name];
  if (!value || typeof value !== "object") {
    throw new MigrationError(`Prisma delegate tidak ditemukan untuk model ${model.name}.`);
  }
  return value as DataDelegate;
}

function quoteIdentifier(name: string): string {
  return `"${name.replaceAll('"', '""')}"`;
}

function normalizeValue(field: DmmfModel["fields"][number], value: unknown): unknown {
  if (value === null || value === undefined) return value;

  switch (field.type) {
    case "Boolean":
      return value === true || value === 1 || value === BigInt(1) || value === "1";
    case "DateTime": {
      const date = value instanceof Date ? value : new Date(value as string | number);
      if (Number.isNaN(date.getTime())) {
        throw new MigrationError(`Nilai DateTime tidak valid pada model ${field.name}.`);
      }
      return date;
    }
    case "BigInt":
      return BigInt(value as string | number | bigint);
    case "Bytes":
      return Buffer.isBuffer(value) ? value : Uint8Array.from(value as number[]);
    case "Json":
      return typeof value === "string" ? JSON.parse(value) : value;
    default:
      return value;
  }
}

function orderedModels(models: readonly DmmfModel[]): DmmfModel[] {
  const pending = new Map(
    models.map((model) => [
      model.name,
      new Set(
        model.fields
          .filter((field) => field.kind === "object" && (field.relationFromFields?.length ?? 0) > 0)
          .map((field) => field.type)
      ),
    ])
  );
  const order: DmmfModel[] = [];

  while (pending.size > 0) {
    const ready = [...pending]
      .filter(([, dependencies]) => dependencies.size === 0)
      .map(([name]) => name)
      .sort();
    if (ready.length === 0) {
      throw new MigrationError("Relasi database memiliki siklus; migrasi otomatis dibatalkan.");
    }

    for (const name of ready) {
      const model = models.find((candidate) => candidate.name === name);
      if (!model) throw new MigrationError("Urutan model Prisma tidak valid.");
      order.push(model);
      pending.delete(name);
    }
    for (const dependencies of pending.values()) {
      for (const name of ready) dependencies.delete(name);
    }
  }

  return order;
}

function receiptKey(filePath: string): string {
  const prefix = "private/";
  if (!filePath.startsWith(`${prefix}receipts/`)) {
    throw new MigrationError("Receipt menunjuk lokasi file di luar private/receipts/. ");
  }
  const key = filePath.slice(prefix.length).replaceAll("\\", "/");
  if (key.split("/").some((part) => part === "..") || !key.endsWith(".webp")) {
    throw new MigrationError("Path receipt tidak valid untuk bucket Neon.");
  }
  return key;
}

function sha256(data: Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}

function sourceData(sourcePath: string) {
  const database = new Database(sourcePath, { readonly: true, create: false });
  const integrity = database.query("PRAGMA integrity_check").get() as { integrity_check?: string } | null;
  if (integrity?.integrity_check !== "ok") {
    database.close();
    throw new MigrationError("Integritas database SQLite sumber gagal; import dibatalkan.");
  }

  const models = Prisma.dmmf.datamodel.models;
  const sourceTables = new Set(
    (database
      .query("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
      .all() as Array<{ name: string }>).map((table) => table.name)
  );
  const expectedTables = new Set(models.map((model) => model.dbName ?? model.name));
  const unexpectedTables = [...sourceTables].filter((table) => !expectedTables.has(table));
  const missingTables = [...expectedTables].filter((table) => !sourceTables.has(table));
  if (unexpectedTables.length || missingTables.length) {
    database.close();
    throw new MigrationError(
      `Tabel SQLite tidak cocok dengan schema Prisma (tambahan ${unexpectedTables.length}, hilang ${missingTables.length}).`
    );
  }

  const counts = new Map<string, number>();
  const rows = new Map<string, Row[]>();
  for (const model of models) {
    const table = model.dbName ?? model.name;
    const records = database.query(`SELECT * FROM ${quoteIdentifier(table)}`).all() as Row[];
    counts.set(model.name, records.length);
    rows.set(model.name, records);
  }

  const receiptModel = models.find((model) => model.name === "Receipt");
  if (!receiptModel) {
    database.close();
    throw new MigrationError("Model Receipt tidak ditemukan pada schema Prisma.");
  }
  const receipts = (rows.get(receiptModel.name) ?? []).filter(
    (row) => typeof row.filePath === "string" && row.filePath.length > 0
  );
  database.close();

  return { counts, models, receipts, rows };
}

async function transferReceiptFiles(
  receipts: Row[],
  storageRoot: string,
  dryRun: boolean
): Promise<{ copied: number; reused: number; bytes: number }> {
  const privateRoot = path.resolve(storageRoot, "private");
  let copied = 0;
  let reused = 0;
  let bytes = 0;

  for (const receipt of receipts) {
    const filePath = receipt.filePath as string;
    const key = receiptKey(filePath);
    const localPath = path.resolve(privateRoot, ...key.split("/"));
    if (!localPath.startsWith(`${privateRoot}${path.sep}`)) {
      throw new MigrationError("Path receipt keluar dari direktori storage/private.");
    }

    let localBytes: Buffer;
    try {
      localBytes = await readFile(localPath);
    } catch {
      throw new MigrationError("Ada file receipt di database yang tidak ditemukan di storage lokal.");
    }
    if (localBytes.length === 0) {
      throw new MigrationError("File receipt lokal kosong.");
    }
    bytes += localBytes.length;

    if (dryRun) continue;

    const existing = await getReceiptObject(key);
    if (existing) {
      if (sha256(existing) !== sha256(localBytes)) {
        throw new MigrationError("Object receipt dengan key sama sudah ada tetapi isinya berbeda; tidak ada object yang ditimpa.");
      }
      reused += 1;
      continue;
    }

    await putReceiptObject(key, localBytes, "image/webp");
    const persisted = await getReceiptObject(key);
    if (!persisted || sha256(persisted) !== sha256(localBytes)) {
      throw new MigrationError("Verifikasi byte receipt setelah upload gagal.");
    }
    copied += 1;
  }

  return { copied, reused, bytes };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const sourceArg = args.find((arg) => !arg.startsWith("--"));
  const sourcePath = path.resolve(sourceArg ?? "db/custom.db");
  const storageRoot = path.resolve(process.env.STORAGE_ROOT || "./storage");

  const source = sourceData(sourcePath);
  const order = orderedModels(source.models);
  const totalRows = [...source.counts.values()].reduce((sum, count) => sum + count, 0);

  if (dryRun) {
    const fileResult = await transferReceiptFiles(source.receipts, storageRoot, true);
    console.log(
      `DRY_RUN_OK MODELS=${source.models.length} ROWS=${totalRows} RECEIPTS=${source.receipts.length} RECEIPT_BYTES=${fileResult.bytes}`
    );
    return;
  }

  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    const nonEmpty = await Promise.all(
      source.models.map(async (model) => (await delegate(prisma, model).count()) > 0)
    );
    if (nonEmpty.some(Boolean)) {
      throw new MigrationError("Tabel aplikasi Neon tidak kosong; import dibatalkan tanpa mengubah record.");
    }

    const fileResult = await transferReceiptFiles(source.receipts, storageRoot, false);

    await prisma.$transaction(
      async (transaction) => {
        for (const model of order) {
          const records = source.rows.get(model.name) ?? [];
          const scalarFields = model.fields.filter((field) => field.kind !== "object");
          const data = records.map((record) => {
            const item: Row = {};
            for (const field of scalarFields) {
              const column = field.dbName ?? field.name;
              if (!(column in record)) {
                throw new MigrationError(`Kolom ${column} tidak ditemukan pada model ${model.name}.`);
              }
              item[field.name] = normalizeValue(field, record[column]);
            }
            return item;
          });
          const target = delegate(transaction, model);
          for (let offset = 0; offset < data.length; offset += 100) {
            await target.createMany({ data: data.slice(offset, offset + 100) });
          }
        }

        for (const model of source.models) {
          const expected = source.counts.get(model.name) ?? 0;
          const actual = await delegate(transaction, model).count();
          if (actual !== expected) {
            throw new MigrationError(`Verifikasi jumlah record gagal pada model ${model.name}.`);
          }
        }
      },
      { maxWait: 10_000, timeout: 120_000 }
    );

    console.log(
      `IMPORT_OK MODELS=${source.models.length} ROWS=${totalRows} RECEIPTS_COPIED=${fileResult.copied} RECEIPTS_REUSED=${fileResult.reused} RECEIPT_BYTES=${fileResult.bytes}`
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  if (error instanceof MigrationError) {
    console.error(`IMPORT_ABORTED: ${error.message}`);
  } else {
    console.error("IMPORT_FAILED: detail error disembunyikan agar tidak mencetak data atau kredensial.");
  }
  process.exitCode = 1;
});
