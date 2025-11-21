export function applyConditionChange(
  product,
  transaction,
  dto,
  urls: string[],
) {
  product.lastConditionNote = dto.note;
  product.lastConditionImages = urls;

  transaction.returnDate = new Date();

  if (dto.condition === 'good') {
    product.condition = 'good';
    product.status = 'available';
    product.reuseCount += 1;

    transaction.status = 'returned';
    transaction.borrowTransactionType = 'return_success';
  } else {
    product.condition = 'damaged';
    product.status = 'non-available';

    transaction.status = 'rejected';
    transaction.borrowTransactionType = 'return_failed';
  }
}
