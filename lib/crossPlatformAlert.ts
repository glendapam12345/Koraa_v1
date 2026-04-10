import { Alert, Platform } from 'react-native';

export type AlertButtonStyle = 'cancel' | 'destructive' | 'default';

export interface AlertButton {
  text: string;
  style?: AlertButtonStyle;
  onPress?: () => void;
}

export function showAlert(title: string, message: string, buttons: AlertButton[] = [{ text: 'OK' }]): void {
  if (Platform.OS === 'web') {
    if (buttons.length === 1) {
      window.alert(`${title}\n\n${message}`);
      buttons[0].onPress?.();
      return;
    }
    const confirmed = window.confirm(`${title}\n\n${message}`);
    if (confirmed) {
      const confirmButton = buttons.find((b) => b.style !== 'cancel');
      confirmButton?.onPress?.();
    } else {
      const cancelButton = buttons.find((b) => b.style === 'cancel');
      cancelButton?.onPress?.();
    }
    return;
  }
  Alert.alert(title, message, buttons);
}

/**
 * Confirmación con dos botones. En web usa `window.confirm` (solo aceptar / cancelar).
 */
export function showConfirm(
  title: string,
  message: string,
  confirmText: string,
  onConfirm: () => void,
  options?: { cancelText?: string; destructive?: boolean },
): void {
  const cancelText = options?.cancelText ?? 'Cancelar';
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
