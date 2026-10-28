'use client';

import * as React from 'react';
import { motion, type Variants } from 'motion/react';

import {
  getVariants,
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@animate-ui/react/icons';

// Fallback wrapper (icon tidak tersedia di registry Animate UI - dibuat manual
// dengan path Lucide asli + pola komponen Animate UI yang identik).
type FileArchiveProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    group: {
      initial: {
        scale: 1,
      },
      animate: {
        scale: [1, 1.06, 1],
        transformOrigin: 'center',
        transition: { duration: 0.5, ease: 'easeInOut' },
      },
    },
    path1: {},
    path2: {},
    path3: {},
    path4: {},
    path5: {},
    path6: {},
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: FileArchiveProps) {
  const { controls } = useAnimateIconContext();
  const variants = getVariants(animations);

  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      variants={variants.group}
      initial="initial"
      animate={controls}
      {...props}
    >
      <motion.path
        d={"M10 12v-1"}
        variants={variants.path1}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d={"M10 18v-2"}
        variants={variants.path2}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d={"M10 7V6"}
        variants={variants.path3}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d={"M14 2v4a2 2 0 0 0 2 2h4"}
        variants={variants.path4}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d={"M15.5 22H18a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v16a2 2 0 0 0 .274 1.01"}
        variants={variants.path5}
        initial="initial"
        animate={controls}
      />
      <motion.circle
        cx={"10"} cy={"20"} r={"2"}
        variants={variants.path6}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function FileArchive(props: FileArchiveProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  FileArchive,
  FileArchive as FileArchiveIcon,
  type FileArchiveProps,
  type FileArchiveProps as FileArchiveIconProps,
};
