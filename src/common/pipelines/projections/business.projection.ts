export const BusinessProjectionStage = {
  $project: {
    _id: 1,
    userId: 1,
    businessName: 1,
    businessPhone: 1,
    businessAddress: 1,
    businessType: 1,
    businessLogoUrl: 1,
    location: 1,
    openTime: 1,
    closeTime: 1,
    distance: 1,
    // username: '$user.username',
    role: '$user.role',
    isActive: '$user.isActive',
    isBlocked: '$user.isBlocked',
    createdAt: 1,
    updatedAt: 1,
  },
};

export const BusinessDetailProjectionStage = {
  $addFields: {
    username: { $arrayElemAt: ['$user.username', 0] },
    email: { $arrayElemAt: ['$user.email', 0] },
    role: { $arrayElemAt: ['$user.role', 0] },
    isActive: { $arrayElemAt: ['$user.isActive', 0] },
    isBlocked: { $arrayElemAt: ['$user.isBlocked', 0] },
  },
};

export const RemoveUserFieldStage = {
  $project: {
    user: 0,
  },
};
