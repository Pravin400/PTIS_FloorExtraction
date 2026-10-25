/* eslint-disable @next/next/no-img-element */
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  MASCOT_HAPPY_BASE64,
  MASCOT_NEUTRAL_BASE64,
  MASCOT_SAD_BASE64,
} from './mascot-assets';

export type MascotMood = 'happy' | 'sad' | 'neutral';

export interface AnimatedMascotProps {
  className?: string;
  size?: number;
  mood?: MascotMood;
}

const MASCOT_MAP: Record<MascotMood, string> = {
  happy: MASCOT_HAPPY_BASE64,
  neutral: MASCOT_NEUTRAL_BASE64,
  sad: MASCOT_SAD_BASE64,
};

/**
 * 3D Blue Sphere Animated Mascot Component.
 * - Restores the exact original 3D blue glossy sphere character.
 * - Inlined as zero-network Base64 data URIs (no external HTTP requests, no static PNGs stored).
 * - Dynamic mood expressions:
 *   * 'happy': 3D glossy blue ball with joyful open smile & rosy cheeks.
 *   * 'neutral': 3D glossy blue ball with calm, friendly smile.
 *   * 'sad': 3D glossy blue ball with downturned pout & teardrop.
 * - Physics-based floating and hover interaction with Framer Motion.
 */
export const AnimatedMascot: React.FC<AnimatedMascotProps> = ({
  className = 'w-14 h-14',
  size,
  mood = 'neutral',
}) => {
  const imageSrc = MASCOT_MAP[mood] || MASCOT_MAP.neutral;

  return (
    <motion.div
      className={`relative shrink-0 flex items-center justify-center cursor-pointer select-none ${className}`}
      style={size ? { width: size, height: size } : undefined}
      animate={
        mood === 'sad'
          ? {
              y: [0, 3, 0],
              scale: [1, 0.98, 1],
            }
          : mood === 'neutral'
            ? {
                y: [0, -3, 0],
                scale: [1, 1.01, 1],
              }
            : {
                y: [0, -6, 0],
                scale: [1, 1.04, 1],
              }
      }
      transition={{
        duration: mood === 'sad' ? 3.0 : mood === 'neutral' ? 2.6 : 2.2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      whileHover={{
        scale: 1.15,
        rotate: mood === 'sad' ? [0, -3, 3, 0] : [0, -6, 6, -3, 0],
        transition: { duration: 0.35 },
      }}
      whileTap={{ scale: 0.95 }}
      title={`3D Mascot (${mood})`}
    >
      <img
        src={imageSrc}
        alt={`3D Mascot (${mood})`}
        width={size}
        height={size}
        className="w-full h-full object-contain pointer-events-none"
        draggable={false}
      />
    </motion.div>
  );
};
