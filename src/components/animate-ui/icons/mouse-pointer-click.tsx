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
type MousePointerClickProps = IconProps<keyof typeof animations>;

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
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: MousePointerClickProps) {
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
        d={"M14 4.1 12 6"}
        variants={variants.path1}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d={"m5.1 8-2.9-.8"}
        variants={variants.path2}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d={"m6 12-1.9 2"}
        variants={variants.path3}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d={"M7.2 2.2 8 5.1"}
        variants={variants.path4}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d={"M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z"}
        variants={variants.path5}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function MousePointerClick(props: MousePointerClickProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  MousePointerClick,
  MousePointerClick as MousePointerClickIcon,
  type MousePointerClickProps,
  type MousePointerClickProps as MousePointerClickIconProps,
};
