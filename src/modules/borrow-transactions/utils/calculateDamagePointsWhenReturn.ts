export function calculateTotalDamagePointsWhenReturn(
  damageFaces: Array<{ face: string; issue: string }>,
  damagePolicy: Record<string, number> = {},
) {
  let total = 0;

  for (const item of damageFaces) {
    const issue = item.issue;

    // Nếu issue tồn tại trong damagePolicy thì cộng điểm
    if (issue && damagePolicy[issue] != null) {
      total += damagePolicy[issue];
    }
  }

  return total;
}
