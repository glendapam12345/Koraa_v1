import type { ViewStyle } from 'react-native';
import { THEME } from '@/constants/theme';

/** Cancela el padding horizontal del contenedor de pantalla (heroes full-bleed). */
export function bleedScreenPaddingX(): ViewStyle {
  return { marginHorizontal: -THEME.layout.screenPaddingX };
}

/** Estilos del cuerpo scrollable compartido por CalmScreen y tabs legacy. */
export function screenContentBase(): ViewStyle {
  return {
    paddingHorizontal: THEME.layout.screenPaddingX,
    width: '100%',
    maxWidth: THEME.layout.screenMaxWidth,
    alignSelf: 'center',
  };
}
