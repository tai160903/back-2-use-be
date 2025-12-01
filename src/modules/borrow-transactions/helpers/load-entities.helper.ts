import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { RolesEnum } from 'src/common/constants/roles.enum';

export async function loadEntities(
  serialNumber: string,
  userId: string,
  role: RolesEnum,
  session,
  models: {
    businessesModel;
    productModel;
    productGroupModel;
    productSizeModel;
    materialModel;
    borrowTransactionModel;
    customerModel;
    walletsModel;
    systemSettingsModel;
    staffModel;
  },
) {
  const {
    businessesModel,
    productModel,
    productGroupModel,
    productSizeModel,
    materialModel,
    borrowTransactionModel,
    customerModel,
    walletsModel,
    systemSettingsModel,
    staffModel,
  } = models;

  let business;

  // --- Role Staff ---
  if (role === RolesEnum.STAFF) {
    const staff = await staffModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .session(session);

    if (!staff) throw new BadRequestException('Staff not found.');

    business = await businessesModel
      .findById(staff.businessId)
      .session(session);
    if (!business)
      throw new BadRequestException('Business not found for this staff');

    // ⚡ Chuyển userId thành business.ownerId để dùng query ví
    userId = business.userId.toString();
  }

  // --- Role Business ---
  if (role === RolesEnum.BUSINESS) {
    business = await businessesModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .session(session);

    if (!business) throw new NotFoundException('Business not found');
  }

  // --- Product ---
  const product = await productModel
    .findOne({ serialNumber, isDeleted: false })
    .session(session);

  if (!product) throw new NotFoundException('Product not found');

  // --- Product Group ---
  const productGroup = await productGroupModel
    .findById(product.productGroupId)
    .session(session);

  if (!productGroup) throw new NotFoundException('Product group not found');

  if (productGroup.businessId.toString() !== business._id.toString()) {
    throw new BadRequestException(
      'This product does not belong to your business.',
    );
  }

  // --- Product Size ---
  const productSize = await productSizeModel
    .findById(product.productSizeId)
    .session(session);

  if (!productSize) throw new NotFoundException('Product size not found');

  // --- Material ---
  const material = await materialModel
    .findById(productGroup.materialId)
    .session(session);

  if (!material) throw new NotFoundException('Material not found');

  // --- Borrow Transaction ---
  const borrowTransaction = await borrowTransactionModel
    .findOne({
      productId: product._id,
      businessId: business._id,
      status: 'borrowing',
    })
    .session(session);

  if (!borrowTransaction)
    throw new BadRequestException('No active borrowing transaction found.');

  // --- Customer ---
  const customer = await customerModel
    .findById(borrowTransaction.customerId)
    .session(session);

  if (!customer) throw new NotFoundException('Customer not found');

  // --- Customer Wallet ---
  const customerWallet = await walletsModel
    .findOne({
      userId: customer.userId,
      type: 'customer',
    })
    .session(session);

  if (!customerWallet) throw new NotFoundException('Customer wallet not found');

  // --- Business Wallet ---
  const businessWallet = await walletsModel
    .findOne({
      userId: business.userId,
      type: 'business',
    })
    .session(session);

  if (!businessWallet) throw new NotFoundException('Business wallet not found');

  // --- Reward Policy ---
  const rewardPolicy = await systemSettingsModel
    .findOne({ category: 'reward', key: 'reward_policy' })
    .session(session);

  if (!rewardPolicy) throw new NotFoundException('Reward policy not found');

  // --- Borrow Policy ---
  const borrowPolicy = await systemSettingsModel
    .findOne({ category: 'borrow', key: 'borrow_policy' })
    .session(session);

  if (!borrowPolicy) throw new NotFoundException('Borrow policy not found');

  // --- Damage Policy ---
  const damagePolicy = await systemSettingsModel
    .findOne({ category: 'return_check', key: 'damage_issues' })
    .session(session);

  if (!damagePolicy) throw new NotFoundException('Damage policy not found');

  return {
    business,
    customer,
    product,
    productGroup,
    productSize,
    material,
    borrowTransaction,
    customerWallet,
    businessWallet,
    rewardPolicy: rewardPolicy.value,
    borrowPolicy: borrowPolicy.value,
    damagePolicy: damagePolicy.value,
  };
}
