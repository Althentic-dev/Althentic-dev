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
type PackagePlusProps = IconProps<keyof typeof animations>;

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

function IconComponent({ size, ...props }: PackagePlusProps) {
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
        d={"M16 16h6"}
        variants={variants.path1}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d={"M19 13v6"}
        variants={variants.path2}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d={"M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"}
        variants={variants.path3}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d={"m7.5 4.27 9 5.15"}
        variants={variants.path4}
        initial="initial"
        animate={controls}
      />
      <motion.polyline
        points={"3.29 7 12 12 20.71 7"}
        variants={variants.path5}
        initial="initial"
        animate={controls}
      />
      <motion.line
        x1={"12"} x2={"12"} y1={"22"} y2={"12"}
        variants={variants.path6}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function PackagePlus(props: PackagePlusProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  PackagePlus,
  PackagePlus as PackagePlusIcon,
  type PackagePlusProps,
  type PackagePlusProps as PackagePlusIconProps,
};
