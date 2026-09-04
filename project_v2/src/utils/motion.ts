import { useEffect, useState } from 'react';
import type { Transition, Variants } from 'framer-motion';

export const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function useReducedMotion() {
  const [reduced, setReduced] = useState(prefersReducedMotion);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    onChange();
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  return reduced;
}

export const defaultTransition: Transition = {
  duration: prefersReducedMotion ? 0 : 0.25,
  ease: [0.22, 1, 0.36, 1],
};

export const smoothTransition: Transition = {
  duration: prefersReducedMotion ? 0 : 0.4,
  ease: [0.22, 1, 0.36, 1],
};

export const springTransition: Transition = {
  type: 'spring',
  stiffness: prefersReducedMotion ? 1000 : 260,
  damping: prefersReducedMotion ? 1000 : 24,
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: defaultTransition,
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: defaultTransition,
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: prefersReducedMotion ? 1 : 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: defaultTransition,
  },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: prefersReducedMotion ? 0 : 24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: defaultTransition,
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: prefersReducedMotion ? 0 : 0.08,
      delayChildren: 0.05,
    },
  },
};

export const staggerFast: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: prefersReducedMotion ? 0 : 0.05,
      delayChildren: 0.02,
    },
  },
};

export const viewportOnce = {
  once: true,
  margin: '-80px',
};

export const viewportOnceNear = {
  once: true,
  margin: '-40px',
};
