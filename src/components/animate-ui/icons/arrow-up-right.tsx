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
type ArrowUpRightProps = IconProps<keyof typeof animations>;

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
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: ArrowUpRightProps) {
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
        d={"M7 7h10v10"}
        variants={variants.path1}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d={"M7 17 17 7"}
        variants={variants.path2}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function ArrowUpRight(props: ArrowUpRightProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  ArrowUpRight,
  ArrowUpRight as ArrowUpRightIcon,
  type ArrowUpRightProps,
  type ArrowUpRightProps as ArrowUpRightIconProps,
};
