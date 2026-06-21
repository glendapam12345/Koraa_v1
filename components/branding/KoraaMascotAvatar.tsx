import { View, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';

type KoraaMascotAvatarProps = {
  size?: number;
};

/** Ellie — mascota suave de Koraa (círculo lavanda). */
export function KoraaMascotAvatar({ size = 44 }: KoraaMascotAvatarProps) {
  const eyeSize = Math.max(4, Math.round(size * 0.09));
  const eyeGap = Math.max(10, Math.round(size * 0.22));

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={[styles.eyes, { gap: eyeGap }]}>
        <View style={[styles.eye, { width: eyeSize, height: eyeSize, borderRadius: eyeSize / 2 }]} />
        <View style={[styles.eye, { width: eyeSize, height: eyeSize, borderRadius: eyeSize / 2 }]} />
      </View>
      <View
        style={[
          styles.smile,
          {
            width: size * 0.34,
            height: size * 0.17,
            borderBottomLeftRadius: size * 0.2,
            borderBottomRightRadius: size * 0.2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: THEME.colors.calm.lavenderDeep,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    ...THEME.shadows.soft,
  },
  eyes: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  eye: {
    backgroundColor: THEME.colors.onGradient,
  },
  smile: {
    borderBottomWidth: 2,
    borderColor: THEME.colors.onGradient,
    marginTop: -1,
  },
});
