export class CreateBorrowTransactionDto {
  customerId: string;
  productId: string;
  businessId: string;
  borrowDate: Date;
  dueDate: Date;
  returnDate?: Date;
  depositAmount: number;
  status:
    | 'pending_pickup'
    | 'borrowing'
    | 'returned'
    | 'return_late'
    | 'rejected'
    | 'lost'
    | 'canceled';
}
