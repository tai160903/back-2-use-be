export function determineFinalCondition(
  dto: any,
  damagePolicy: Record<string, number>,
  totalPoints: number,
) {
  const issues = [
    dto.frontIssue,
    dto.backIssue,
    dto.leftIssue,
    dto.rightIssue,
    dto.topIssue,
    dto.bottomIssue,
  ].filter(Boolean);

  // 1. Tổng điểm
  if (totalPoints > 12) return 'damaged';

  const count = (type: string) => issues.filter((i) => i === type).length;

  if (count('scratch_heavy') > 3) return 'damaged';

  if (count('dent_small') > 3) return 'damaged';
  if (count('dent_large') > 1) return 'damaged';
  if (count('dent_large') >= 1 && count('dent_small') >= 1) return 'damaged';

  if (count('crack_small') > 1) return 'damaged';

  if (
    issues.includes('deformed') ||
    issues.includes('broken') ||
    issues.includes('crack_large')
  )
    return 'damaged';

  return 'good';
}
