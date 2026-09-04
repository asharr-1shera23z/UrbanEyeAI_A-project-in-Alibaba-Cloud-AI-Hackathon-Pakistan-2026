import { useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

export function CustomCursor() {
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  const x = useSpring(0, { stiffness: 650, damping: 26, mass: 0.45 });
  const y = useSpring(0, { stiffness: 650, damping: 26, mass: 0.45 });

  useEffect(() => {
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      setIsTouch(true);
      return;
    }

    const handleMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setIsVisible(true);
    };

    const handleEnter = () => setIsVisible(true);
    const handleLeave = () => setIsVisible(false);
    const handleDown = () => setIsClicking(true);
    const handleUp = () => setIsClicking(false);

    const handleOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isClickable =
        target.closest('a, button, [role="button"], input, textarea, select, label, [data-cursor-hover]') !== null;
      setIsHovering(isClickable);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseover', handleOver);
    window.addEventListener('mousedown', handleDown);
    window.addEventListener('mouseup', handleUp);
    document.body.addEventListener('mouseenter', handleEnter);
    document.body.addEventListener('mouseleave', handleLeave);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseover', handleOver);
      window.removeEventListener('mousedown', handleDown);
      window.removeEventListener('mouseup', handleUp);
      document.body.removeEventListener('mouseenter', handleEnter);
      document.body.removeEventListener('mouseleave', handleLeave);
    };
  }, [x, y]);

  if (isTouch) return null;

  return (
    <>
      {/* Main cursor dot / ring */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999]"
        style={{ x, y }}
        animate={{
          opacity: isVisible ? 1 : 0,
          scale: isClicking ? 1.12 : isHovering ? 1.5 : 1,
        }}
        transition={{ opacity: { duration: 0.12 }, scale: { duration: 0.15 } }}
      >
        <div className="relative -translate-x-1/2 -translate-y-1/2">
          <div
            className={`rounded-full transition-all duration-200 ${
              isHovering
                ? 'w-5 h-5 border-[2.5px] border-[#2563eb] bg-transparent shadow-[0_0_20px_rgba(37,99,235,0.9)]'
                : 'w-3 h-3 bg-[#2563eb] shadow-[0_0_14px_rgba(37,99,235,1),0_0_28px_rgba(59,130,246,0.7)]'
            }`}
          />
          {!isHovering && (
            <div className="absolute inset-0 rounded-full bg-white/40 animate-ping" style={{ animationDuration: '2s' }} />
          )}
        </div>
      </motion.div>

      {/* Soft glow follower */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9998]"
        style={{ x, y }}
        animate={{
          opacity: isVisible ? (isHovering ? 0.25 : 0.14) : 0,
          scale: isHovering ? 1.1 : 1,
        }}
        transition={{ opacity: { duration: 0.18 }, scale: { duration: 0.2 } }}
      >
        <div className="relative -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.35),transparent_70%)] blur-md" />
      </motion.div>
    </>
  );
}
