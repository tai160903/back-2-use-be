export function calculateEcoPoint(productSize, material) {
  const plasticPrevented = productSize.plasticEquivalentWeight;

  const rawCo2 = (plasticPrevented / 1000) * material.co2EmissionPerKg;

  // làm sạch số, giữ tối đa 3 chữ số thập phân
  const co2Reduced = cleanNumber(rawCo2, 3);

  // eco luôn = co2 * 100 (chính xác tuyệt đối)
  const ecoPoint = cleanNumber(co2Reduced * 100, 2);

  return {
    plasticPrevented,
    co2Reduced,
    ecoPoint,
  };
}

function cleanNumber(num, decimals = 3) {
  const cleaned = parseFloat(num.toFixed(10));
  const parts = cleaned.toString().split('.');

  if (!parts[1]) return cleaned;

  const truncated = parts[1].slice(0, decimals);
  return parseFloat(parts[0] + '.' + truncated);
}
