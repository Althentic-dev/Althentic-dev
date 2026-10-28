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
type GitBranchProps = IconProps<keyof typeof animations>;

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

function IconComponent({ size, ...props }: GitBranchProps) {
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
      <motion.line
        x1={"6"} x2={"6"} y1={"3"} y2={"15"}
        variants={variants.path1}
        initial="initial"
        animate={controls}
      />
      <motion.circle
        cx={"18"} cy={"6"} r={"3"}
        variants={variants.path2}
        initial="initial"
        animate={controls}
      />
      <motion.circle
        cx={"6"} cy={"18"} r={"3"}
        variants={variants.path3}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d={"M18 9a9 9 0 0 1-9 9"}
        variants={variants.path4}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function GitBranch(props: GitBranchProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  GitBranch,
  GitBranch as GitBranchIcon,
  type GitBranchProps,
  type GitBranchProps as GitBranchIconProps,
};
