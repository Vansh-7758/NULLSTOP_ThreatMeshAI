'use client';

// Shared Framer Motion animation variants
// Used across all section components for consistency

import { Variants } from "framer-motion";

/** Fade up with slight vertical travel */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 36 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

/** Fade in without movement */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.55, ease: 'easeInOut' } },
};

/** Scale in from slightly small */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  show:   { opacity: 1, scale: 1, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

/** Slide in from left */
export const slideLeft: Variants = {
  hidden: { opacity: 0, x: -48 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

/** Slide in from right */
export const slideRight: Variants = {
  hidden: { opacity: 0, x: 48 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

/** Stagger container — wraps children with stagger delay */
export const stagger: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.10,
      delayChildren: 0.05,
    },
  },
};

/** Faster stagger for dense grids */
export const staggerFast: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.0,
    },
  },
};

/** Slow stagger for big reveals */
export const staggerSlow: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.14,
      delayChildren: 0.1,
    },
  },
};

/** Hover lift spring */
export const hoverLift: Variants = {
  rest:  { y: 0,  scale: 1,    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  hover: { y: -6, scale: 1.01, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

/** Viewport trigger helper — reuse as whileInView prop */
export const inViewProps = {
  initial: 'hidden',
  whileInView: 'show',
  viewport: { once: true, amount: 0.15 },
};
