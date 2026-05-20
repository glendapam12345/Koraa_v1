import { Alert, Platform } from 'react-native';
import { type AppLocale, translate } from '@/lib/i18n';

export type AlertButtonStyle = 'cancel' | 'destructive' | 'default';

export interface AlertButton {
  text: string;
  style?: AlertButtonStyle;
  onPress?: () => void;
}

export function showAlert(
  title: string,
  message: string,
  buttons?: AlertButton[],
  locale: AppLocale = 'es',
): void {
  const resolvedButtons = buttons ?? [{ text: translate(locale, 'errors.ok') }];
  if (Platform.OS === 'web') {
    if (resolvedButtons.length === 1) {
      window.alert(`${title}\n\n${message}`);
      resolvedButtons[0].onPress?.();
      return;
    }
    const confirmed = window.confirm(`${title}\n\n${message}`);
    if (confirmed) {
      const confirmButton = resolvedButtons.find((b) => b.style !== 'cancel');
      confirmButton?.onPress?.();
    } else {
      const cancelButton = resolvedButtons.find((b) => b.style === 'cancel');
      cancelButton?.onPress?.();
    }
    return;
  }
  Alert.alert(title, message, resolvedButtons);
}

/**
 * Confirmación con dos botones. En web usa `window.confirm` (solo aceptar / cancelar).
 */
export function showConfirm(
  title: string,
  message: string,
  confirmText: string,
  onConfirm: () => void,
  options?: { cancelText?: string; destructive?: boolean; locale?: AppLocale },
): void {
  const cancelText =
    options?.cancelText ?? translate(options?.locale ?? 'es', 'common.cancel');
  const destructive = options?.destructive ?? false;

  if (Platform.OS === 'web') {
    const ok = window.confirm(`${title}\n\n${message}\n\n${confirmText}`);
    if (ok) onConfirm();
    return;
  }

  Alert.alert(title, message, [
    { text: cancelText, style: 'cancel' },
    {
      text: confirmText,
      style: destructive ? 'destructive' : 'default',
      onPress: onConfirm,
    },
  ]);
}
