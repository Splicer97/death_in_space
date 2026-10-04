import { StyleSheet } from 'react-native';
import { colors, font, radius, spacing } from '../../theme';

export const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  subLabel: {
    color: colors.textDim,
    fontSize: font.tiny,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  rollButton: { marginTop: spacing.lg },
  total: {
    color: colors.yellow,
    fontSize: 64,
    fontWeight: '900',
    textAlign: 'center',
  },
  formula: {
    color: colors.text,
    fontSize: font.body,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  verdict: {
    fontSize: font.heading,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  note: {
    color: colors.textFaint,
    fontSize: font.tiny,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  dieBox: {
    width: 68,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  dieValue: { color: colors.text, fontSize: 20, fontWeight: '800' },
  dieLabel: { color: colors.textFaint, fontSize: font.tiny, letterSpacing: 1 },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.xs,
  },
  historyText: { color: colors.textDim, fontSize: font.small },
  historyVerdict: { fontSize: font.tiny, fontWeight: '800' },
});
