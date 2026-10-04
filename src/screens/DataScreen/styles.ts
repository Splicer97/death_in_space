import { StyleSheet } from 'react-native';
import { colors, font, spacing } from '../../theme';

export const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  card: { marginBottom: spacing.lg },
  text: {
    color: colors.textDim,
    fontSize: font.small,
    lineHeight: 19,
    marginBottom: spacing.md,
  },
  hint: {
    color: colors.textFaint,
    fontSize: font.tiny,
    lineHeight: 16,
    marginTop: spacing.md,
  },
  field: {
    marginBottom: spacing.md,
  },
  ok: {
    color: colors.green,
    fontSize: font.small,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  error: {
    color: colors.red,
    fontSize: font.small,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: {
    flex: 1,
  },
  rowButton: { marginLeft: spacing.sm, width: 120 },
});
