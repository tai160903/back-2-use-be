export function calculateTotalDamagePoints(
  dto: any,
  damagePolicy: Record<string, number> = {},
) {
  console.log('damagePolicy loaded:', damagePolicy);

  const faces = [
    dto.frontIssue,
    dto.backIssue,
    dto.leftIssue,
    dto.rightIssue,
    dto.topIssue,
    dto.bottomIssue,
  ];

  let total = 0;

  for (const issue of faces) {
    if (issue && damagePolicy[issue] != null) {
      total += damagePolicy[issue];
    }
  }

  return total;
}
