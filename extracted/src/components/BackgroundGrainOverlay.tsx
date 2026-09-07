import React from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * BackgroundGrainOverlay component
 * Renders the exact inline SVG data-URI noise pattern as a fixed full-screen overlay
 * with opacity: 0.06, mix-blend-mode: overlay, z-index: 1. Only active in Light Mode.
 */
export const BackgroundGrainOverlay: React.FC = () => {
  const { theme } = useTheme();

  const opacity = theme === 'dark' ? 0.05 : 0.06;

  return (
    <div
      id={`${theme}-mode-grain-overlay`}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
        opacity,
        mixBlendMode: 'overlay',
        backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23n)"/></svg>')`,
        backgroundRepeat: 'repeat',
      }}
    />
  );
};

