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
    },
    gradient: {
      blue: '#4A90E2',
      pink: '#FF6B6B',
    },
    background: {
      secondary: '#F4F4F7',
    },
    border: '#E0E0E0',
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
