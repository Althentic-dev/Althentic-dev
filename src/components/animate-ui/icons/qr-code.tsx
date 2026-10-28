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
type QrCodeProps = IconProps<keyof typeof animations>;

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
    path7: {},
    path8: {},
    path9: {},
    path10: {},
    path11: {},
    path12: {},
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: QrCodeProps) {
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
        width={"5"} height={"5"} x={"3"} y={"3"} rx={"1"}
        variants={variants.path1}
        initial="initial"
        animate={controls}
      />
      <motion.rect
        width={"5"} height={"5"} x={"16"} y={"3"} rx={"1"}
        variants={variants.path2}
        initial="initial"
        animate={controls}
      />
      <motion.rect
        width={"5"} height={"5"} x={"3"} y={"16"} rx={"1"}
        variants={variants.path3}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d={"M21 16h-3a2 2 0 0 0-2 2v3"}
        variants={variants.path4}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d={"M21 21v.01"}
        variants={variants.path5}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d={"M12 7v3a2 2 0 0 1-2 2H7"}
        variants={variants.path6}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d={"M3 12h.01"}
        variants={variants.path7}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d={"M12 3h.01"}
        variants={variants.path8}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d={"M12 16v.01"}
        variants={variants.path9}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d={"M16 12h1"}
        variants={variants.path10}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d={"M21 12v.01"}
        variants={variants.path11}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d={"M12 21v-1"}
        variants={variants.path12}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function QrCode(props: QrCodeProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  QrCode,
  QrCode as QrCodeIcon,
  type QrCodeProps,
  type QrCodeProps as QrCodeIconProps,
};
