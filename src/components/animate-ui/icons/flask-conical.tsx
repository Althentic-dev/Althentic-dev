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
type FlaskConicalProps = IconProps<keyof typeof animations>;

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
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: FlaskConicalProps) {
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
        d={"M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2"}
        variants={variants.path1}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d={"M6.453 15h11.094"}
        variants={variants.path2}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d={"M8.5 2h7"}
        variants={variants.path3}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function FlaskConical(props: FlaskConicalProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  FlaskConical,
  FlaskConical as FlaskConicalIcon,
  type FlaskConicalProps,
  type FlaskConicalProps as FlaskConicalIconProps,
};
