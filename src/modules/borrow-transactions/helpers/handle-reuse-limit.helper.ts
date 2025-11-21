export function handleReuseLimit(product, material) {
  const skipConditions = ['damaged', 'lost'];

  if (skipConditions.includes(product.condition)) {
    return;
  }

  if (product.reuseCount >= material.reuseLimit) {
    product.status = 'non-available';
    product.condition = 'expired';
  }
}
