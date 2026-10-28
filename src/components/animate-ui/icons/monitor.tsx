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
type MonitorProps = IconProps<keyof typeof animations>;

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

function IconComponent({ size, ...props }: MonitorProps) {
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
      <motion.rect
        width={"20"} height={"14"} x={"2"} y={"3"} rx={"2"}
        variants={variants.path1}
        initial="initial"
        animate={controls}
      />
      <motion.line
        x1={"8"} x2={"16"} y1={"21"} y2={"21"}
        variants={variants.path2}
        initial="initial"
        animate={controls}
      />
      <motion.line
        x1={"12"} x2={"12"} y1={"17"} y2={"21"}
        variants={variants.path3}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function Monitor(props: MonitorProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  Monitor,
  Monitor as MonitorIcon,
  type MonitorProps,
  type MonitorProps as MonitorIconProps,
};
