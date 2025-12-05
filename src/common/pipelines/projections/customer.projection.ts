export const CustomerProjectionStage = {
  $project: {
    _id: 1,
    userId: 1,
    fullName: 1,
    phone: 1,
    email: '$user.email',
    avatar: '$user.avatar',
    // username: '$user.username',
    role: '$user.role',
    isActive: '$user.isActive',
    isBlocked: '$user.isBlocked',
    createdAt: 1,
    updatedAt: 1,
  },
};

export const CustomerDetailProjectionStage = {
  $addFields: {
    username: { $arrayElemAt: ['$user.username', 0] },
    email: { $arrayElemAt: ['$user.email', 0] },
    role: '$user.role',
    isActive: { $arrayElemAt: ['$user.isActive', 0] },
    isBlocked: { $arrayElemAt: ['$user.isBlocked', 0] },
  },
};
