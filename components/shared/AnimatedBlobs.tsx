'use client';

import { motion } from 'framer-motion';

/**
 * Animated gradient blobs for page background (REF: Kantin 40-ref-ui App.tsx).
 * Covers the entire viewport dynamically.
 */
export function AnimatedBlobs() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 h-full w-full overflow-hidden">
      {/* Blob 1 — primary (top-left) */}
      <motion.div
        animate={{
          x: [0, 20, -10, 0],
          y: [0, -20, 15, 0],
          scale: [1, 1.05, 0.95, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -left-[10vw] -top-[15vh] h-[50vh] w-[80vw] rounded-full bg-primary/15 blur-[100px]"
      />

      {/* Blob 2 — accent (center-right) */}
      <motion.div
        animate={{
          x: [0, -25, 15, 0],
          y: [0, 25, -15, 0],
          scale: [1, 0.95, 1.05, 1],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -right-[20vw] top-[20vh] h-[60vh] w-[90vw] rounded-full bg-accent/15 blur-[120px]"
      />

      {/* Blob 3 — warm pastel (bottom-left) */}
      <motion.div
        animate={{
          x: [0, 15, -20, 0],
          y: [0, 15, -25, 0],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{ duration: 35, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -bottom-[15vh] left-[5vw] h-[50vh] w-[70vw] rounded-full bg-[#FFE5D9]/30 blur-[100px]"
      />
    </div>
  );
}
