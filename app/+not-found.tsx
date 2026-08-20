import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useI18n } from '@/contexts/I18nContext';
import { THEME } from '@/constants/theme';
import { HOY_TAB_HREF } from '@/lib/tabNavigation';

export default function NotFoundScreen() {
  const { t } = useI18n();
  return (
    <>
      <Stack.Screen options={{ title: t('notFound.title') }} />
      <View style={styles.container}>
        <Text style={styles.text}>{t('notFound.message')}</Text>
        <Link href={HOY_TAB_HREF} style={styles.link}>
          <Text>{t('notFound.goHome')}</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  text: {
    ...THEME.typography.sectionTitle,
    fontWeight: 600,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
