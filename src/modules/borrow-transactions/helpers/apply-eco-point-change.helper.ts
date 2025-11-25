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

  switch (borrowStatus) {
    case 'returned':
    case 'return_late':
      // +eco, +co2
      addedEcoPoints = ecoPoint;
      addedCo2 = co2Reduced;

      business.ecoPoints += addedEcoPoints;
      business.co2Reduced += addedCo2;
      break;

    case 'rejected':
    case 'lost':
      addedEcoPoints = 0;
      addedCo2 = -co2Reduced;

      business.co2Reduced += addedCo2;
      break;

    default:
      break;
  }

  return {
    plasticPrevented,
    addedEcoPoints,
    addedCo2,
  };
}
