import { NotFoundException } from '@nestjs/common';

export async function loadEntitiesForCheck(
  serialNumber: string,
  models: {
    productModel;
    productGroupModel;
    productSizeModel;
    materialModel;
    borrowTransactionModel;
    systemSettingsModel;
  },
) {
  const {
    productModel,
    productGroupModel,
    productSizeModel,
    materialModel,
    borrowTransactionModel,
    systemSettingsModel,
  } = models;

  // --- Product ---
  const product = await productModel.findOne({
    serialNumber,
    isDeleted: false,
  });

  if (!product) throw new NotFoundException('Product not found');

  // --- Product Group ---
  const productGroup = await productGroupModel.findById(product.productGroupId);
  if (!productGroup) throw new NotFoundException('Product group not found');

  // --- Product Size ---
  const productSize = await productSizeModel.findById(product.productSizeId);
  if (!productSize) throw new NotFoundException('Product size not found');

  // --- Material ---
  const material = await materialModel.findById(productGroup.materialId);
  if (!material) throw new NotFoundException('Material not found');

  // --- Damage Policy ---
  const damagePolicy = await systemSettingsModel.findOne({
    category: 'return_check',
    key: 'damage_issues',
  });
  if (!damagePolicy) throw new NotFoundException('Damage policy not found');

  // --- Borrow Policy ---
  const borrowPolicy = await systemSettingsModel.findOne({
    category: 'borrow',
    key: 'borrow_policy',
  });
  if (!borrowPolicy) throw new NotFoundException('Borrow policy not found');

  return {
    product,
    productSize,
    material,
    damagePolicy: damagePolicy.value,
    borrowPolicy: borrowPolicy.value,
  };
}
