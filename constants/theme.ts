import { TextStyle, ViewStyle } from 'react-native';

/** Single source for calm palette — used by colors.calm and surfaces.* */
const CALM = {
  background: '#F8F5FC',
  card: '#FFFFFF',
  lavender: '#EDE6FA',
  lavenderDeep: '#7B61A8',
  blush: '#F9EEF5',
  mist: '#F0EBF8',
  border: '#E6DDF2',
} as const;

const SHADOW_CARD = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.04,
  shadowRadius: 8,
  elevation: 2,
} as const;

export const THEME = {
  colors: {
    /** @deprecated Prefer `calm.card` — legacy alias */
    fill: {
      100: CALM.card,
      /** @deprecated Prefer `calm.mist` */
      200: CALM.mist,
    },
    /** Fondo y acentos suaves (calma / mascota Ellie) */
    calm: CALM,
    /** @deprecated Prefer `calm.border` */
    stroke: {
      100: CALM.border,
    },
    text: {
      main: '#121212',
      secondary: '#595959',
      /** Iconos y decoración. En párrafos largos preferir `secondary` o `metaOnFill`. */
      tertiary: '#707070',
      /** Meta legible sobre calm.mist (~4.5:1 WCAG AA a 13px). */
      metaOnFill: '#595959',
    },
    gradient: {
      blue: '#4A90E2',
      pink: '#FF6B6B',
    },
    /** @deprecated Prefer `calm.mist` */
    background: {
      secondary: CALM.mist,
    },
    /** @deprecated Prefer `calm.border` */
    border: CALM.border,
    /** Overlay for modals and backdrops */
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayStrong: 'rgba(0, 0, 0, 0.7)',
    overlayLight: 'rgba(0, 0, 0, 0.4)',
    /** Light dark scrim on glass cards */
    scrimLight: 'rgba(0, 0, 0, 0.18)',
    /** Semi-opaque calm background wash */
    calmScrim: 'rgba(248, 245, 252, 0.92)',
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
      /** Frosted glass fills on gradient cards */
      glass: 'rgba(255, 255, 255, 0.55)',
      glassLight: 'rgba(255, 255, 255, 0.45)',
      glassHeavy: 'rgba(255, 255, 255, 0.75)',
      glassOpaque: 'rgba(255, 255, 255, 0.92)',
      glassBorder: 'rgba(255, 255, 255, 0.65)',
      glassBorderLight: 'rgba(255, 255, 255, 0.85)',
      glassBorderSoft: 'rgba(255, 255, 255, 0.6)',
      glassBorderFaint: 'rgba(255, 255, 255, 0.35)',
      wash: 'rgba(255, 255, 255, 0.28)',
      washLight: 'rgba(255, 255, 255, 0.22)',
      washStrong: 'rgba(255, 255, 255, 0.38)',
    },
    /** Semantic: success, danger (use for errors/destructive) */
    semantic: {
      success: '#4CAF50',
      successSoft: 'rgba(39, 174, 96, 0.12)',
      danger: '#FF6B6B',
      dangerSoft: 'rgba(255, 107, 107, 0.08)',
      dangerBorder: 'rgba(255, 107, 107, 0.19)',
      warn: '#D4A017',
      warnSoft: 'rgba(255, 193, 7, 0.12)',
      warnBorder: 'rgba(255, 152, 0, 0.35)',
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
      /** Vision / priority star in week planner */
      star: '#F5C842',
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
    /** Para mí, headers premium, cards de patrón */
    parami: {
      header: ['#4A90E2', '#7B61A8', '#FF6B6B'] as const,
      balanceCard: 'rgba(255, 255, 255, 0.14)',
      moodCard: ['#7B61A8', '#FF6B6B'] as const,
      energyCard: ['#4A90E2', '#6BB6FF'] as const,
      symptomsCard: ['#FF6B6B', '#7B61A8'] as const,
    },
    /** Emergency Kit entry card */
    emergencyKit: {
      card: ['#6B5B95', '#9B8EC4', '#C4B5E8'] as const,
    },
    /** Carousel slot gradients (Tips / recommendations — one pair per slot) */
    carousel: {
      slotGradients: [
        ['#4A90E2', '#5B8FD9'],
        ['#FF6B6B', '#E85D75'],
        ['#3EB489', '#4A90E2'],
        ['#9B59B6', '#9B7EDE'],
        ['#F4A261', '#FFA500'],
        ['#2A9D8F', '#48CAE4'],
      ] as const,
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
    /** Metadata and secondary hints (replaces ad-hoc 11px overrides). */
    meta: {
      fontSize: 13,
      lineHeight: 18,
      fontFamily: 'DMSans-Medium',
      color: '#595959',
    } as TextStyle,
    /** Compact labels (chips, calendar cells, chart footnotes). */
    micro: {
      fontSize: 10,
      lineHeight: 12,
      fontFamily: 'DMSans-Medium',
    } as TextStyle,
    /** Smallest axis labels (sparklines, mini charts). */
    tiny: {
      fontSize: 9,
      lineHeight: 12,
      fontFamily: 'DMSans-Medium',
    } as TextStyle,
    /** Título principal de tab (Hoy, Tips, Semana, Vaciar). */
    screenTitle: {
      fontSize: 28,
      lineHeight: 34,
      fontFamily: 'DMSans-Bold',
    } as TextStyle,
    screenSubtitle: {
      fontSize: 15,
      lineHeight: 22,
      fontFamily: 'DMSans-Medium',
    } as TextStyle,
    /** Encabezado de sección dentro de una tab. */
    sectionTitle: {
      fontSize: 20,
      lineHeight: 26,
      fontFamily: 'DMSans-Bold',
    } as TextStyle,
    /** Título de tarjeta o bloque intermedio (entre caption y sectionTitle). */
    cardTitle: {
      fontSize: 17,
      lineHeight: 22,
      fontFamily: 'DMSans-Bold',
    } as TextStyle,
    /** Subtítulo destacado en filas, headers compactos, iconos + texto. */
    subheading: {
      fontSize: 18,
      lineHeight: 24,
      fontFamily: 'DMSans-Bold',
    } as TextStyle,
    /** Etiqueta meta sobre bloques (historial, premium, racha). */
    sectionEyebrow: {
      fontSize: 12,
      lineHeight: 16,
      fontFamily: 'DMSans-Bold',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    } as TextStyle,
    /** Título compacto de pantalla (22px — entre sectionTitle y h3). */
    titleCompact: {
      fontSize: 22,
      lineHeight: 28,
      fontFamily: 'DMSans-Bold',
    } as TextStyle,
    /** Emoji grande (mood cards, tips hero). */
    displayEmoji: {
      fontSize: 28,
      lineHeight: 34,
    } as TextStyle,
    /** Emoji mediano (frentes, proyectos, chips). */
    displayEmojiMd: {
      fontSize: 22,
      lineHeight: 28,
    } as TextStyle,
    /** Emoji pequeño (filas, iconos inline). */
    displayEmojiSm: {
      fontSize: 20,
      lineHeight: 26,
    } as TextStyle,
  },

  spacing: {
    xs: 8,
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
  },

  layout: {
    /** Margen horizontal de pantallas con scroll (única fuente; no sumar marginHorizontal en hijos). */
    screenPaddingX: 14,
    screenMaxWidth: 520,
    sectionGap: 20,
    /** Espaciado estándar entre secciones en las 4 tabs visibles (24px). */
    tabSectionGap: 24,
    /** Entre bloques en tabs con muchas tarjetas (Tips, Para mí). */
    sectionGapCompact: 12,
    /** Espacio extra sobre la tab bar flotante (altura ~64 + margen). */
    floatingTabBarClearance: 80,
  },

  /** Tarjetas y paneles reutilizables — preferir sobre estilos locales en cada pantalla. */
  surfaces: {
    elevated: {
      backgroundColor: CALM.card,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: CALM.border,
      ...SHADOW_CARD,
    } as ViewStyle,
    muted: {
      backgroundColor: CALM.mist,
      borderRadius: 16,
    } as ViewStyle,
    tinted: {
      backgroundColor: CALM.lavender,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: CALM.border,
    } as ViewStyle,
    /** Chips inactivos (filtros, pills). */
    chip: {
      backgroundColor: CALM.mist,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: CALM.border,
    } as ViewStyle,
    /** Chips activos/seleccionados (filtros Semana, toggles). */
    chipSelected: {
      backgroundColor: CALM.lavenderDeep,
      borderRadius: 24,
      borderWidth: 0,
    } as ViewStyle,
    /** Paneles secundarios colapsables (hints, bloques vacíos). */
    panel: {
      backgroundColor: CALM.mist,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: CALM.border,
    } as ViewStyle,
  },

  borderRadius: {
    standard: 8,
    rounded: 16,
    pill: 24,
    full: 32,
    card: 20,
    xl: 28,
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
      ...SHADOW_CARD,
    },
    /** Active capture / listening state (lavenderDeep glow) */
    lavenderGlow: {
      shadowColor: CALM.lavenderDeep,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 3,
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
