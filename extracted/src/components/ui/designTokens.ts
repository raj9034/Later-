/**
 * LATER DESIGN SYSTEM TOKENS (STATION 1 SOURCE OF TRUTH)
 * Calm • Intelligent • Premium
 * Light Mode: "Soft Grain" (Airy, warm, soft blush undertone, frosted glass)
 * Dark Mode: "Cutting-Edge Classic" (Deep, cinematic, cool undertone, premium restraint)
 * 
 * Typographic Triad:
 * - Manrope (Display & Headings): Geometric, humanist clarity, bold title authority
 * - Inter (UI & Body): Neutral, hyper-legible, optimal for scanning
 * - JetBrains Mono (Metadata & Time): Technical precision for timestamps & countdowns
 */

export const LaterTokens = {
  // Brand Identity and Usage Rules
  brand: {
    name: 'Later',
    essence: 'Calm + Intelligent + Premium',
    principle: 'Luxury through restraint • Soft Cloud × Dark Luxury',
    prohibited: [
      'NEVER use the old "Capture" tagline',
      'Do NOT make everything glow (no neon/arbitrary cyan-magenta glow)',
      'No heavy, muddy drop shadows',
      'No all-caps logo distortion',
    ],
    typography: {
      wordmark: 'font-display font-bold tracking-tight',
      tagline: 'type-caption text-[var(--text-secondary)]',
    },
    clearSpace: 'Minimum 1x cap-height (16px) around the brand mark on all sides',
    approvedCanvases: {
      light: 'Soft Cloud (#FAF8F5 warm neutral atmosphere)',
      dark: 'Dark Luxury (#100C16 deep cinematic multi-layer foundation)',
    },
  },

  colors: {
    // Dynamic CSS Variable references that respond to [data-theme="light" | "dark"]
    bg: {
      canvas: 'var(--bg)',
      surface: 'var(--surface)',
      surfaceElevated: 'var(--surface-elevated)',
      surfaceSunken: 'var(--surface-sunken)',
      surfaceResting: 'var(--surface-resting)',
      surfaceInput: 'var(--surface)',
      surfaceHover: 'var(--surface-elevated)',
      surfaceActive: 'var(--border)',
    },
    border: {
      subtle: 'var(--border-subtle)',
      default: 'var(--border)',
      elevated: 'var(--border)',
      hover: 'var(--border)',
      focus: 'var(--accent)',
      divider: 'var(--divider)',
    },
    text: {
      primary: 'var(--text-primary)',
      secondary: 'var(--text-secondary)',
      tertiary: 'var(--text-tertiary)',
      accent: 'var(--accent)',
      gold: 'var(--accent-gold)',
    },
    accent: {
      primary: 'var(--accent)',
      gold: 'var(--accent-gold)',
      soft: 'var(--accent-soft)',
      deep: 'var(--accent-deep)',
      success: 'var(--success)',
      warning: 'var(--warning)',
      destructive: 'var(--destructive)',
    },
    // Priority / Important / Chill Semantic Triad (Calibrated for Dark Luxury & Soft Cloud)
    semanticUrgency: {
      priority: {
        name: 'Priority',
        icon: 'Flame',
        light: {
          accent: '#D94862',
          border: 'rgba(217, 72, 98, 0.35)',
          bgTint: 'rgba(217, 72, 98, 0.06)',
          badgeText: '#D94862',
          pulse: 'urgentBorderPulse 2s ease-in-out infinite',
        },
        dark: {
          accent: '#C4536B',
          border: 'rgba(196, 83, 107, 0.45)',
          borderLeft: '#C4536B',
          bgTint: 'rgba(196, 83, 107, 0.08)',
          badgeText: '#C4536B',
          glow: '0 0 20px rgba(196, 83, 107, 0.12)',
          pulse: 'urgentBorderPulseDark 2.5s ease-in-out infinite',
        },
      },
      important: {
        name: 'Important',
        icon: 'Star',
        light: {
          accent: '#C28E38',
          border: 'rgba(194, 142, 56, 0.35)',
          bgTint: 'rgba(194, 142, 56, 0.06)',
          badgeText: '#C28E38',
          static: true,
        },
        dark: {
          accent: '#B8975E',
          border: 'rgba(184, 151, 94, 0.40)',
          borderLeft: '#B8975E',
          bgTint: 'rgba(184, 151, 94, 0.07)',
          badgeText: '#B8975E',
          glow: '0 0 14px rgba(184, 151, 94, 0.08)',
          static: true,
        },
      },
      chill: {
        name: 'Chill',
        icon: 'Leaf',
        light: {
          accent: '#4A6D8C',
          border: 'rgba(90, 127, 158, 0.35)',
          bgTint: 'rgba(90, 127, 158, 0.06)',
          badgeText: '#4A6D8C',
          drift: 'wave-drift 5s ease-in-out infinite',
        },
        dark: {
          accent: '#E4E6ED',
          border: 'rgba(228, 230, 237, 0.35)',
          borderLeft: '#E4E6ED',
          bgTint: 'rgba(228, 230, 237, 0.06)',
          badgeText: '#E4E6ED',
          glow: '0 0 18px rgba(228, 230, 237, 0.10)',
          drift: 'wave-drift 5s ease-in-out infinite',
        },
      },
    },
    // Static definitions for light & dark palettes
    dark: {
      bg: '#100C16',
      surface: 'rgba(26, 22, 34, 0.82)',
      surfaceElevated: 'rgba(22, 18, 30, 0.92)',
      surfaceSunken: '#0D0A11',
      surfaceResting: 'rgba(26, 22, 34, 0.8)',
      border: 'rgba(201, 166, 255, 0.18)',
      borderSubtle: 'rgba(255, 255, 255, 0.08)',
      divider: 'rgba(201, 166, 255, 0.12)',
      textPrimary: '#F4F2F6',
      textSecondary: '#9C97A5',
      textTertiary: '#66626F',
      accent: '#B584FF',
      accentGold: '#E8C87A',
      accentSoft: 'rgba(181, 132, 255, 0.15)',
      accentDeep: '#B584FF',
      success: '#7FBF9A',
      warning: '#D9A85C',
      destructive: '#D97C7C',
    },
    light: {
      bg: '#FAF8F5',
      surface: 'rgba(255, 255, 255, 0.88)',
      surfaceElevated: 'rgba(255, 255, 255, 0.94)',
      surfaceSunken: 'rgba(0, 0, 0, 0.04)',
      surfaceResting: 'rgba(255, 255, 255, 0.70)',
      border: 'rgba(0, 0, 0, 0.08)',
      borderSubtle: 'rgba(0, 0, 0, 0.04)',
      divider: 'rgba(0, 0, 0, 0.06)',
      textPrimary: '#1E1B18',
      textSecondary: '#6B625B',
      textTertiary: '#9E948C',
      accent: '#D94862',
      accentGold: '#C28E38',
      accentSoft: 'rgba(217, 72, 98, 0.12)',
      accentDeep: '#C43D56',
      success: '#2E7D52',
      warning: '#C2782A',
      destructive: '#C93B3B',
    },
  },

  typography: {
    fontDisplay: 'font-display',
    fontBody: 'font-body',
    fontMono: 'font-mono',
    scale: {
      displayLg: 'type-display-lg', // Manrope 24px 700 1.2
      display: 'type-display',       // Manrope 22px 700 1.25
      headingLg: 'type-heading-lg', // Manrope 15px 600 1.3 0.01em
      heading: 'type-heading',       // Manrope 15px 600 1.35
      bodyLg: 'type-body-lg',       // Inter 14px 400 1.45
      body: 'type-body',             // Inter 14px 400 1.45
      bodySm: 'type-body-sm',       // Inter 12.5px 400 1.4
      label: 'type-label',           // Inter 11px 600 1.2 0.02em
      caption: 'type-caption',       // Inter 10.5px 500 1.3
      button: 'type-button',         // Inter 14px 600 1.2
    },
  },

  spacing: {
    1: '4px',   // --space-1 (4px)
    2: '8px',   // --space-2 (8px)
    3: '12px',  // --space-3 (12px)
    4: '16px',  // --space-4 (16px)
    5: '20px',  // --space-5 (20px)
    6: '24px',  // --space-6 (24px)
    8: '32px',  // --space-8 (32px)
    10: '40px', // --space-10 (40px)
    12: '48px', // --space-12 (48px)
  },

  radius: {
    sm: 'rounded-xl',     // 12px --radius-sm: resting list items, small chips
    md: 'rounded-2xl',    // 16px --radius-md: buttons, inputs
    lg: 'rounded-3xl',    // 24px --radius-lg: floating/glass cards, modals, sheets
    full: 'rounded-full', // 999px --radius-full: pills, tabs, FAB
  },

  // Deliberate Later Elevation System (5 distinct levels)
  elevation: {
    0: 'elevation-0', // Base canvas / background (flat)
    1: 'elevation-1', // Resting surface / card
    2: 'elevation-2', // Floating card / hover state
    3: 'elevation-3', // Elevated card / popover / drawer
    4: 'elevation-4', // Sheet / Modal Dialog
    5: 'elevation-5', // Highest floating element (FAB, Toast, Overlay)
    descriptions: {
      0: 'Base background plane (none)',
      1: 'Resting list items and subtle containers',
      2: 'Floating cards, active drag previews, hovered cards',
      3: 'Action menus, dropdown popovers, schedule presets',
      4: 'Item detail sheets, reschedule bottom sheets, modal dialogs',
      5: 'Floating action buttons (FAB) and system toasts',
    },
  },

  // Button Foundation Specs
  buttons: {
    variants: {
      primary: 'High-emphasis call to action using brand accent color',
      secondary: 'Balanced surface-elevated button with subtle border',
      tertiary: 'Subtle ghost action with clean hover response',
      pill: 'Segmented / action pill with rounded-full geometry',
      icon: 'Square / rounded-xl icon action with touch-target padding',
    },
    states: [
      'default',
      'hover',
      'pressed (active:scale-[0.98])',
      'focused (focus-ring-later / focus-visible:ring-2)',
      'disabled (opacity-40, pointer-events-none)',
      'loading (Loader2 animation, disabled interaction)',
      'success (subtle positive feedback)',
    ],
    paddingRatio: '2:1 horizontal to vertical padding ratio',
  },

  // Navigation System Specs
  navigation: {
    container: 'overflow-x-auto no-scrollbar py-2.5 border-b border-[var(--divider)]',
    item: {
      base: 'px-3 py-1.5 rounded-full type-label select-none transition-all duration-150 cursor-pointer flex items-center gap-1.5 outline-none focus-visible:ring-1 focus-visible:ring-[var(--border)] active:scale-[0.97]',
      active: 'theme-tab-active font-semibold',
      inactive: 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] border border-transparent',
      badgeActive: 'theme-tab-badge-active',
      badgeInactive: 'bg-[var(--surface-sunken)] text-[var(--text-tertiary)]',
    },
    touchTarget: 'minimum 44px touch height or padded hit-area',
  },

  // Sheets and Modals Foundation Specs
  sheetsAndModals: {
    surface: 'glass-detail-sheet / glass-modal',
    radius: 'rounded-t-[24px] sm:rounded-[24px]',
    backdrop: 'sheet-backdrop (translucent, non-obscuring, light-bleed capable)',
    elevation: 'elevation-3 / elevation-4',
    maxWidth: {
      sm: 'max-w-sm (384px)',
      md: 'max-w-md (448px)',
      lg: 'max-w-lg (512px)',
      xl: 'max-w-xl (576px)',
    },
    transitions: {
      sheet: { type: 'spring', damping: 28, stiffness: 350 },
      modal: { duration: 0.2, ease: 'easeOut' },
    },
  },

  // System States Foundation Specs
  systemStates: {
    loading: 'Quiet loader animation or subtle skeleton pulse (later-skeleton)',
    empty: 'Calm illustrative icon, editorial heading, gentle reassurance',
    error: 'Destructive-tinted icon, friendly non-technical copy, clear retry action',
    success: 'Positive check confirmation, subtle green/accent feedback',
    disabled: 'opacity-40 with pointer-events-none and neutral cursor',
  },

  // Accessibility Foundation Specs
  accessibility: {
    minTouchTarget: 'min-h-[44px] min-w-[44px]',
    focusRing: 'focus-ring-later (2px solid var(--accent), 2px offset)',
    wcagContrast: 'Minimum 4.5:1 for body text; 3:1 for large text & UI components',
    reducedMotion: '@media (prefers-reduced-motion: reduce) sets animation to 0.01ms',
    iconButtons: 'Must always provide aria-label or accessible title attribute',
  },

  // Responsive Foundation Specs
  responsive: {
    breakpoints: {
      sm: '640px (Small tablet / landscape phone)',
      md: '768px (Tablet portrait)',
      lg: '1024px (Tablet landscape / desktop)',
      xl: '1280px (Desktop)',
    },
    mobileScreenTiers: {
      compact: '< 380px (Small Android devices: compact padding, concise labels)',
      standard: '390px - 414px (Standard smartphones: default Later rhythm)',
      large: '428px+ (Large smartphones: comfortable spacing)',
      tablet: '768px+ (Centering container max-w-xl with comfortable side gutters)',
    },
    containers: {
      appContainer: 'max-w-xl mx-auto',
      cardContent: 'w-full',
      sheetWidth: 'w-full max-w-lg mx-auto',
    },
  },

  transition: {
    fast: 'transition-all duration-150 var(--ease-standard)',
    normal: 'transition-all duration-250 var(--ease-standard)',
    smooth: 'transition-all duration-400 var(--ease-out)',
  },

  motion: {
    ease: {
      standard: [0.4, 0, 0.2, 1] as const,
      out: [0, 0, 0.2, 1] as const,
      in: [0.4, 0, 1, 1] as const,
    },
    duration: {
      fast: 0.15, // 150ms
      base: 0.25, // 250ms
      slow: 0.4,  // 400ms
    },
    pressScale: 0.97,
  },

  touch: {
    minTarget: 'min-h-[44px] min-w-[44px]',
  },
} as const;

export const DESIGN_TOKENS = LaterTokens;
export const motionTokens = LaterTokens.motion;


