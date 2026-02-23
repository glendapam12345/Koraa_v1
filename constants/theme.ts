import { TextStyle } from 'react-native';

export const THEME = {
  colors: {
    fill: {
      100: '#FFFFFF',
      200: '#F4F4F7',
    },
    stroke: {
      100: '#E0E0E0',
    },
    text: {
      main: '#121212',
      secondary: '#595959',
      tertiary: '#999999',
    },
    gradient: {
      blue: '#4A90E2',
      pink: '#FF6B6B',
    },
    background: {
      secondary: '#F4F4F7',
    },
    border: '#E0E0E0',
    /** Overlay for modals and backdrops */
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayStrong: 'rgba(0, 0, 0, 0.7)',
    overlayLight: 'rgba(0, 0, 0, 0.4)',
    /** Text/icon on gradient buttons and dark surfaces */
    onGradient: '#FFFFFF',
    onGradientSoft: 'rgba(255, 255, 255, 0.95)',
    onGradientMuted: 'rgba(255, 255, 255, 0.9)',
    onGradientSubtle: 'rgba(255, 255, 255, 0.88)',
    onGradientFaint: 'rgba(255, 255, 255, 0.65)',
    /** White with alpha for glass/surface overlays */
    surfaceOverlay: {
      strong: 'rgba(255, 255, 255, 0.25)',
      medium: 'rgba(255, 255, 255, 0.2)',
      soft: 'rgba(255, 255, 255, 0.18)',
      light: 'rgba(255, 255, 255, 0.15)',
      faint: 'rgba(255, 255, 255, 0.12)',
      veryFaint: 'rgba(255, 255, 255, 0.06)',
      border: 'rgba(255, 255, 255, 0.3)',
      borderMedium: 'rgba(255, 255, 255, 0.5)',
      borderStrong: 'rgba(255, 255, 255, 0.4)',
    },
    /** Semantic: success, danger (use for errors/destructive) */
    semantic: {
      success: '#4CAF50',
      danger: '#FF6B6B',
      dangerSoft: 'rgba(255, 107, 107, 0.08)',
      dangerBorder: 'rgba(255, 107, 107, 0.19)',
    },
    /** Category colors for tasks (Hogar, Trabajo, etc.) */
    category: {
      trabajo: '#4A90E2',
      hogar: '#27AE60',
      salud: '#FF6B6B',
      personal: '#9B59B6',
      contenido: '#E67E22',
      marca: '#8E44AD',
      otros: '#595959',
    },
    /** Blue/pink with alpha for tints */
    tint: {
      blue: {
        soft: 'rgba(74, 144, 226, 0.15)',
        light: 'rgba(74, 144, 226, 0.12)',
        faint: 'rgba(74, 144, 226, 0.1)',
        veryLight: 'rgba(74, 144, 226, 0.08)',
        veryFaint: 'rgba(74, 144, 226, 0.06)',
        border: 'rgba(74, 144, 226, 0.25)',
      },
      pink: {
        soft: 'rgba(255, 107, 107, 0.1)',
        border: 'rgba(255, 107, 107, 0.25)',
      },
    },
    /** Error/danger surface (e.g. error message box) */
    errorSurface: '#FFE5E5',
    errorBorder: '#FF6B6B',
    /** Accent colors for gradients/charts (keep palette consistent) */
    accent: {
      yellow: '#FFD700',
      orange: '#FFA500',
      purple: '#6C5CE7',
    },
    /** Chart/confetti palette (array for graphs and celebrations) */
    chartPalette: ['#6BB6FF', '#4A90E2', '#52C9A2', '#2E9D7A', '#FFD93D', '#FFB84D', '#FF9F66', '#FF7F50', '#FF6B6B', '#E55555', '#B794F6', '#9B7EDE'] as const,
    confettiPalette: ['#FF6B6B', '#4A90E2', '#9B59B6', '#FFD700', '#FF1493', '#00CED1'] as const,
    /** Meditation buttons: done (gray), morning (salmon→pink), evening (purple) */
    meditationGradient: {
      done: ['#E8E8E8', '#F5F5F5'] as const,
      morning: ['#FFA07A', '#FF6B6B'] as const,
      evening: ['#9B59B6', '#6C5CE7'] as const,
    },
    /** Gradient tints for headers/cards (blue→pink soft) */
    gradientTint: {
      header: ['rgba(74, 144, 226, 0.08)', 'rgba(255, 107, 107, 0.06)', 'transparent'] as const,
      weekNav: ['rgba(74, 144, 226, 0.12)', 'rgba(255, 107, 107, 0.08)'] as const,
      dayToday: ['rgba(74, 144, 226, 0.2)', 'rgba(255, 107, 107, 0.12)'] as const,
    },
    /** Emotion check-in tints (soft background per emotion) */
    emotionTint: {
      enfocada: 'rgba(74, 144, 226, 0.15)',
      motivada: 'rgba(255, 107, 107, 0.15)',
      tranquila: 'rgba(78, 205, 196, 0.15)',
      ansiosa: 'rgba(255, 193, 7, 0.15)',
      agotada: 'rgba(155, 89, 182, 0.15)',
      abrumada: 'rgba(255, 152, 0, 0.15)',
      default: 'rgba(74, 144, 226, 0.15)',
    },
  },

  fonts: {
    heading: {
      medium: 'DMSans-Medium' as const,
      bold: 'DMSans-Bold' as const,
    },
    accent: {
      italic: 'LibreBaskerville-Italic' as const,
    },
  },

  typography: {
    h1: {
      fontSize: 32,
      lineHeight: 40,
      fontFamily: 'DMSans-Bold',
    } as TextStyle,
    h2: {
      fontSize: 28,
      lineHeight: 32,
      fontFamily: 'DMSans-Bold',
    } as TextStyle,
    h3: {
      fontSize: 24,
      lineHeight: 32,
      fontFamily: 'DMSans-Medium',
    } as TextStyle,
    body: {
      fontSize: 16,
      lineHeight: 24,
      fontFamily: 'DMSans-Medium',
    } as TextStyle,
    bodyAccent: {
      fontSize: 16,
      lineHeight: 24,
      fontFamily: 'LibreBaskerville-Italic',
    } as TextStyle,
    caption: {
      fontSize: 14,
      lineHeight: 20,
      fontFamily: 'DMSans-Medium',
    } as TextStyle,
    small: {
      fontSize: 12,
      lineHeight: 16,
      fontFamily: 'DMSans-Medium',
    } as TextStyle,
  },

  spacing: {
    xs: 8,
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
  },

  borderRadius: {
    standard: 8,
    rounded: 16,
    pill: 24,
    full: 32,
  },

  shadows: {
    shadowColorDark: '#000000',
    shadowColorLight: '#FFFFFF',
    soft: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 3,
    },
    card: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
  },

  sizes: {
    touchTarget: 48,
    buttonHeight: 48,
    inputHeight: 48,
    iconStandard: 24,
    iconLarge: 32,
  },
} as const;

export type Theme = typeof THEME;
