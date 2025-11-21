import { calculateEcoPoint } from '../utils/calculate-eco-point';

export function applyEcoPointChange(
  business,
  productSize,
  material,
  borrowStatus,
) {
  const { plasticPrevented, co2Reduced, ecoPoint } = calculateEcoPoint(
    productSize,
    material,
  );

  let addedEcoPoints = 0;
  let addedCo2 = 0;

  if (borrowStatus === 'returned') {
    // +eco, +co2
    addedEcoPoints = ecoPoint;
    addedCo2 = co2Reduced;

    business.ecoPoints += addedEcoPoints;
    business.co2Reduced += addedCo2;
  } else if (borrowStatus === 'rejected') {
    // -co2, 0 eco
    addedEcoPoints = 0;
    addedCo2 = -co2Reduced;

    business.co2Reduced += addedCo2;
  }

  return {
    plasticPrevented,
    addedEcoPoints,
    addedCo2,
  };
}
