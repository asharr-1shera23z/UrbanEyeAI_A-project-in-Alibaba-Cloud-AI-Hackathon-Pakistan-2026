import { motion } from 'framer-motion';

interface LogoProps {
  size?: number;
  animated?: boolean;
  className?: string;
}

// Aspect ratio (height / width) of the provided mark artwork.
const MARK_ASPECT = 268 / 497;

export function LogoMark({ size = 44, animated = false, className = '' }: LogoProps) {
  const img = (
    <img
      src="/logo-mark.png"
      width={size}
      height={size * MARK_ASPECT}
      style={{ width: size, height: size * MARK_ASPECT, objectFit: 'contain' }}
      className={className}
      alt="UrbanEye AI logo"
    />
  );

  if (!animated) return img;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {img}
    </motion.div>
  );
}

export function LogoFull({
  size = 40,
  showTagline = false,
  className = '',
}: {
  size?: number;
  showTagline?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex flex-col leading-none ${className}`}>
      <img
        src="/logo-full.png"
        style={{ height: size, width: 'auto' }}
        alt="UrbanEye AI — AI-Powered Urban Infrastructure Intelligence Platform"
      />
      {showTagline && (
        <span className="text-slate-400 font-medium mt-1" style={{ fontSize: size * 0.2 }}>
          See the problem. Understand it. Fix it.
        </span>
      )}
    </div>
  );
}
