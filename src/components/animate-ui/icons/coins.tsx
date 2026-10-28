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
type CoinsProps = IconProps<keyof typeof animations>;

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

function IconComponent({ size, ...props }: CoinsProps) {
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
      <motion.circle
        cx={"8"} cy={"8"} r={"6"}
        variants={variants.path1}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d={"M18.09 10.37A6 6 0 1 1 10.34 18"}
        variants={variants.path2}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d={"M7 6h1v4"}
        variants={variants.path3}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d={"m16.71 13.88.7.71-2.82 2.82"}
        variants={variants.path4}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function Coins(props: CoinsProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  Coins,
  Coins as CoinsIcon,
  type CoinsProps,
  type CoinsProps as CoinsIconProps,
};
