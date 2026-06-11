import { StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';

export const settingsScreenStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.colors.calm.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.layout.screenPaddingX,
    paddingVertical: THEME.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.calm.border,
  },
  backHit: {
    padding: THEME.spacing.xs,
    width: 44,
  },
  topTitle: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  topRight: {
    width: 44,
  },
  section: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: THEME.spacing.xs,
    marginTop: THEME.spacing.sm,
  },
  emailMuted: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: THEME.spacing.sm + 2,
    paddingHorizontal: THEME.spacing.sm,
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    marginBottom: THEME.spacing.xs,
  },
  rowDanger: {
    backgroundColor: THEME.colors.semantic.dangerSoft,
    borderWidth: 1,
    borderColor: THEME.colors.semantic.dangerBorder,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  rowLabel: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
  },
  rowLabelDanger: {
    ...THEME.typography.body,
    color: THEME.colors.semantic.danger,
    fontFamily: THEME.fonts.heading.bold,
  },
  chevron: {
    ...THEME.typography.h3,
    color: THEME.colors.text.tertiary,
  },
  chevronDanger: {
    ...THEME.typography.h3,
    color: THEME.colors.semantic.danger,
    opacity: 0.7,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.stroke[100],
    marginVertical: THEME.spacing.md,
  },
  stepBlock: {
    paddingTop: THEME.spacing.md,
  },
  stepTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.xs,
  },
  stepSubtitle: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.sm,
  },
  emailBold: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.md,
  },
  centerIcon: {
    alignSelf: 'center',
    marginBottom: THEME.spacing.sm,
  },
  otpWrap: {
    marginBottom: THEME.spacing.md,
  },
  errorText: {
    ...THEME.typography.caption,
    color: THEME.colors.semantic.danger,
    marginBottom: THEME.spacing.sm,
    textAlign: 'center',
  },
  successText: {
    ...THEME.typography.caption,
    color: THEME.colors.semantic.success,
    marginBottom: THEME.spacing.sm,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.rounded,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 14,
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    backgroundColor: THEME.colors.fill[200],
    marginBottom: THEME.spacing.sm,
  },
  resendWrap: {
    paddingVertical: THEME.spacing.md,
    alignItems: 'center',
  },
  resendText: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
  resendMuted: {
    color: THEME.colors.text.tertiary,
  },
  textOnly: {
    paddingVertical: THEME.spacing.md,
    alignItems: 'center',
  },
  linkMuted: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
  panelSection: {
    marginBottom: THEME.spacing.md,
    paddingBottom: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.stroke[100],
  },
  panelSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.xs,
  },
  panelSectionTitle: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  panelSectionHint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.sm,
    lineHeight: 20,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
  },
  chip: {
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs + 2,
    borderRadius: THEME.borderRadius.pill,
    ...THEME.surfaces.chip,
  },
  chipActive: {
    ...THEME.surfaces.chipSelected,
    borderWidth: 0,
  },
  chipText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
  },
  chipTextActive: {
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
  },
  webNote: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.md,
    lineHeight: 20,
  },
  cta: {
    marginTop: THEME.spacing.sm,
  },
});
