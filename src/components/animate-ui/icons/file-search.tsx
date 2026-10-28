'use client';

import * as React from 'react';
import { motion, type Variants } from 'motion/react';

import {
  getVariants,
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@animate-ui/react/icons';

// Fallback wrapper (icon tidak tersedia di registry Animate UI — dibuat manual
// dengan path Lucide asli + pola komponen Animate UI yang identik).
type FileSearchProps = IconProps<keyof typeof animations>;

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
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: FileSearchProps) {
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
        d={"M14 2v4a2 2 0 0 0 2 2h4"}
        variants={variants.path1}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d={"M4.268 21a2 2 0 0 0 1.727 1H18a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v3"}
        variants={variants.path2}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d={"m9 18-1.5-1.5"}
        variants={variants.path3}
        initial="initial"
        animate={controls}
      />
      <motion.circle
        cx={"5"} cy={"14"} r={"3"}
        variants={variants.path4}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function FileSearch(props: FileSearchProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  FileSearch,
  FileSearch as FileSearchIcon,
  type FileSearchProps,
  type FileSearchProps as FileSearchIconProps,
};
