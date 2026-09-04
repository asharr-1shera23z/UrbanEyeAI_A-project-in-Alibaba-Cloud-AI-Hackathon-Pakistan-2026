import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { LogoMark } from './Logo';

interface IntroAnimationProps {
  onComplete: () => void;
}

export function IntroAnimation({ onComplete }: IntroAnimationProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 500);
    }, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: show ? 1 : 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="fixed inset-0 z-[10000] bg-gradient-to-br from-blue-50 via-white to-slate-100 flex items-center justify-center overflow-hidden"
    >
      {/* Full-page background video, low opacity */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none"
      >
        <source src="/intro-bg.mp4" type="video/mp4" />
      </video>

      {/* Animated city grid background */}
      <div className="absolute inset-0 opacity-[0.05]">
        <svg width="100%" height="100%" className="absolute inset-0">
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#0d1d3a" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        <motion.div
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.3 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className="absolute inset-0"
        >
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <motion.path
              d="M0,60 L20,60 L20,40 L40,40 L40,70 L60,70 L60,30 L80,30 L80,50 L100,50"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="1.5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.8, ease: 'easeInOut' }}
            />
          </svg>
        </motion.div>
      </div>

      {/* Decorative glow blobs — matches auth pages */}
      <div className="absolute -top-10 -right-10 w-72 h-72 bg-indigo-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl pointer-events-none" />

      {/* Content */}
      <div className="relative flex flex-col items-center gap-6 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <LogoMark size={96} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: 'easeOut' }}
          className="text-3xl sm:text-4xl font-extrabold tracking-tight text-navy-900 text-center"
        >
          UrbanEye<span className="text-blue-600"> AI</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7, ease: 'easeOut' }}
          className="text-base sm:text-lg text-slate-500 font-medium text-center"
        >
          See the problem. Understand it. Fix it.
        </motion.p>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.9, ease: 'easeOut' }}
          className="h-0.5 w-32 bg-blue-600 origin-center rounded-full"
        />
      </div>
    </motion.div>
  );
}
