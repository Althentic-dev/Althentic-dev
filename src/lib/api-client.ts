"use client";

// Althentic.Dev — API client (semua request relatif, credentials include)

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function api<T = unknown>(
  path: string,
  init?: RequestInit & { json?: unknown }
): Promise<T> {
  const { json, ...rest } = init ?? {};
  const headers: Record<string, string> = {
    ...(rest.headers as Record<string, string>),
  };
  let body = rest.body;
  if (json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  }
  const res = await fetch(path, {
    ...rest,
    headers,
    body,
    credentials: "include",
  });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* no body */
  }
  if (!res.ok) {
    const msg =
      (data as { error?: string })?.error ?? `Terjadi kesalahan (${res.status})`;
    throw new ApiError(msg, res.status, (data as { code?: string })?.code);
  }
  return data as T;
}

export async function uploadFile(
  path: string,
  file: File,
  fields?: Record<string, string>
): Promise<any> {
  const fd = new FormData();
  fd.append("file", file);
  if (fields) {
    Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
  }
  const res = await fetch(path, {
    method: "POST",
    body: fd,
    credentials: "include",
  });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* no body */
  }
  if (!res.ok) {
    const msg =
      (data as { error?: string })?.error ?? `Upload gagal (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  return data;
}

// Upload file sebagai base64 JSON (untuk kasus di mana FormData tidak cocok)
export async function uploadBase64(
  path: string,
  file: File,
  extra?: Record<string, unknown>
): Promise<any> {
  const buf = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return api(path, {
    method: "POST",
    json: {
      fileName: file.name,
      contentType: file.type,
      dataBase64: btoa(binary),
      ...extra,
    },
  });
}
