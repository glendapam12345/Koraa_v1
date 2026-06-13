import { Heart } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { HeaderIconButton } from '@/components/ui/HeaderIconButton';

type HoyCareModeToggleProps = {
  active: boolean;
  onPress: () => void;
};

export function HoyCareModeToggle({ active, onPress }: HoyCareModeToggleProps) {
  const { t } = useI18n();

  return (
    <HeaderIconButton
      onPress={onPress}
      accessibilityLabel={active ? t('hoy.careModeToggleOn') : t('hoy.careModeToggleOff')}
      accessibilityHint={active ? t('hoy.careModeToggleHintOn') : t('hoy.careModeToggleHintOff')}
    >
      <Heart
        size={20}
        color={THEME.colors.calm.lavenderDeep}
        fill={active ? THEME.colors.calm.lavenderDeep : 'transparent'}
        strokeWidth={active ? 0 : 2}
      />
    </HeaderIconButton>
  );
}
