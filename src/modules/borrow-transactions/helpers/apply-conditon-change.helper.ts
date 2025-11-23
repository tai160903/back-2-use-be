export function applyConditionChange(
  product,
  transaction,
  dto,
  urls: string[],
  isLate: boolean,
) {
  product.lastConditionNote = dto.note;
  product.lastConditionImages = urls;

  transaction.returnDate = new Date();

  if (dto.condition === 'good') {
    product.condition = 'good';
    product.status = 'available';
    product.reuseCount += 1;

    // SUCCESS — nhưng trạng thái có thể là returned hoặc return_late
    transaction.borrowTransactionType = 'return_success';
    transaction.status = isLate ? 'return_late' : 'returned';
  } else {
    product.condition = 'damaged';
    product.status = 'non-available';

    // FAILED
    transaction.borrowTransactionType = 'return_failed';
    transaction.status = 'rejected';
  }
}
