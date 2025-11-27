export function determineFinalConditionWhenReturn(
  damageFaces: Array<{ face: string; issue: string }>,
  damagePolicy: Record<string, number>,
  totalPoints: number,
) {
  const issues = damageFaces
    .map((f) => f.issue)
    .filter((i) => i && i !== 'none');

  // 1. Rule tổng điểm
  if (totalPoints > 12) return 'damaged';

  const count = (type: string) => issues.filter((i) => i === type).length;

  // 2. Heavy scratches
  if (count('scratch_heavy') > 3) return 'damaged';

  // 3. Dents
  if (count('dent_small') > 3) return 'damaged';
  if (count('dent_large') > 1) return 'damaged';
  if (count('dent_large') >= 1 && count('dent_small') >= 1) return 'damaged';

  // 4. Cracks
  if (count('crack_small') > 1) return 'damaged';

  // 5. Instant-damaged issues
  if (
    issues.includes('deformed') ||
    issues.includes('broken') ||
    issues.includes('crack_large')
  ) {
    return 'damaged';
  }

  return 'good';
}
