import { motion } from 'framer-motion';

interface Building {
  x: number;
  width: number;
  height: number;
  windows: number;
}

const buildings: Building[] = [
  { x: 0, width: 34, height: 90, windows: 3 },
  { x: 36, width: 46, height: 140, windows: 4 },
  { x: 84, width: 30, height: 70, windows: 2 },
  { x: 116, width: 40, height: 170, windows: 5 },
  { x: 158, width: 34, height: 110, windows: 3 },
  { x: 194, width: 50, height: 190, windows: 6 },
  { x: 246, width: 32, height: 100, windows: 3 },
  { x: 280, width: 42, height: 150, windows: 4 },
  { x: 324, width: 30, height: 80, windows: 2 },
  { x: 356, width: 44, height: 130, windows: 4 },
];

/**
 * Animated urban skyline illustration, used only on the sign-in pages.
 * A bright, daytime version — pure SVG + framer-motion, kept in the
 * existing navy / blue palette so it still matches the rest of the product.
 */
export function CityIllustration({ className = '' }: { className?: string }) {
  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <svg
        viewBox="0 0 400 320"
        className="w-full h-full"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="sky-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#bfdbfe" />
            <stop offset="55%" stopColor="#dbeafe" />
            <stop offset="100%" stopColor="#f0f7ff" />
          </linearGradient>
          <linearGradient id="building-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#dce7f5" />
          </linearGradient>
          <radialGradient id="scan-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sun-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fef9c3" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#fde68a" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Sky */}
        <rect width="400" height="320" fill="url(#sky-gradient)" />

        {/* Sun */}
        <circle cx="330" cy="55" r="60" fill="url(#sun-glow)" />
        <motion.circle
          cx="330"
          cy="55"
          r="22"
          fill="#fef3c7"
          stroke="#fde68a"
          strokeWidth="1"
          animate={{ opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Drifting clouds */}
        <motion.g
          animate={{ x: [-40, 40, -40] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          opacity={0.75}
        >
          <ellipse cx="90" cy="55" rx="42" ry="14" fill="#ffffff" />
          <ellipse cx="60" cy="62" rx="28" ry="11" fill="#ffffff" />
          <ellipse cx="120" cy="62" rx="26" ry="10" fill="#ffffff" />
        </motion.g>
        <motion.g
          animate={{ x: [30, -30, 30] }}
          transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
          opacity={0.6}
        >
          <ellipse cx="240" cy="35" rx="36" ry="11" fill="#ffffff" />
          <ellipse cx="265" cy="30" rx="22" ry="9" fill="#ffffff" />
        </motion.g>

        {/* Circling AI scan ring above the skyline */}
        <motion.circle
          cx="200"
          cy="150"
          r="70"
          fill="none"
          stroke="#2563eb"
          strokeWidth="1"
          strokeDasharray="4 8"
          opacity={0.22}
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '200px 150px' }}
        />

        {/* Buildings */}
        <g>
          {buildings.map((b, i) => (
            <motion.g
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.06, ease: 'easeOut' }}
            >
              <rect
                x={b.x}
                y={320 - b.height}
                width={b.width}
                height={b.height}
                fill="url(#building-gradient)"
                stroke="#94a3b8"
                strokeWidth="0.5"
              />
              {/* Windows — glass reflecting daylight, subtle shimmer */}
              {[...Array(b.windows)].map((_, row) =>
                [...Array(2)].map((__, col) => {
                  const wx = b.x + 6 + col * (b.width - 14);
                  const wy = 320 - b.height + 14 + row * ((b.height - 24) / Math.max(b.windows - 1, 1));
                  const seed = i * 7 + row * 3 + col;
                  return (
                    <motion.rect
                      key={`${row}-${col}`}
                      x={wx}
                      y={wy}
                      width={5}
                      height={7}
                      fill="#93c5fd"
                      animate={{ opacity: [0.35, 0.75, 0.35] }}
                      transition={{
                        duration: 3 + (seed % 4),
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: (seed % 6) * 0.35,
                      }}
                    />
                  );
                })
              )}
            </motion.g>
          ))}
        </g>

        {/* Ground scan-line sweeping across the street */}
        <motion.rect
          x="0"
          y="316"
          width="400"
          height="4"
          fill="#2563eb"
          opacity={0.4}
          animate={{ opacity: [0.15, 0.5, 0.15] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Detection markers with pulse, echoing the map UI elsewhere in the app */}
        {[
          { x: 70, color: '#f59e0b' },
          { x: 210, color: '#2563eb' },
          { x: 330, color: '#16a34a' },
        ].map((m, i) => (
          <g key={i}>
            <circle cx={m.x} cy={314} r="4" fill={m.color} />
            <motion.circle
              cx={m.x}
              cy={314}
              r="4"
              fill={m.color}
              animate={{ scale: [1, 3.2, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.5, ease: 'easeOut' }}
              style={{ transformOrigin: `${m.x}px 314px` }}
            />
          </g>
        ))}

        {/* Scanning "eye" beam moving across the skyline, tying back to the UrbanEye logo */}
        <motion.g
          animate={{ x: [0, 400, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        >
          <circle cx="0" cy="90" r="26" fill="url(#scan-glow)" />
          <circle cx="0" cy="90" r="3" fill="#2563eb" />
        </motion.g>
      </svg>
    </div>
  );
}
