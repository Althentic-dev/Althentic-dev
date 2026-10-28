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
type HashProps = IconProps<keyof typeof animations>;

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

function IconComponent({ size, ...props }: HashProps) {
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
        x1={"4"} x2={"20"} y1={"9"} y2={"9"}
        variants={variants.path1}
        initial="initial"
        animate={controls}
      />
      <motion.line
        x1={"4"} x2={"20"} y1={"15"} y2={"15"}
        variants={variants.path2}
        initial="initial"
        animate={controls}
      />
      <motion.line
        x1={"10"} x2={"8"} y1={"3"} y2={"21"}
        variants={variants.path3}
        initial="initial"
        animate={controls}
      />
      <motion.line
        x1={"16"} x2={"14"} y1={"3"} y2={"21"}
        variants={variants.path4}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function Hash(props: HashProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  Hash,
  Hash as HashIcon,
  type HashProps,
  type HashProps as HashIconProps,
};
