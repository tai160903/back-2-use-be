export function applyEcoPointChange(business, borrowTransaction) {
  const totalCo2 = borrowTransaction.co2Changed ?? 0;

  if (totalCo2 <= 0) {
    return {
      addedEcoPoints: 0,
    };
  }

  const addedEcoPoints = totalCo2 * 100;

  business.ecoPoints += addedEcoPoints;

  return {
    addedEcoPoints,
  };
}
