import { Model } from 'mongoose';

export async function aggregatePaginate<T>(
  model: Model<T>,
  pipeline: any[],
  page: number,
  limit: number,
) {
  const skip = (page - 1) * limit;

  const hasSortStage = pipeline.some((stage) => stage.$sort);

  const sortStage = hasSortStage ? [] : [{ $sort: { createdAt: -1 } }];

  const [data, totalResult] = await Promise.all([
    model.aggregate([
      ...pipeline,
      ...sortStage,
      { $skip: skip },
      { $limit: limit },
    ]),
    model.aggregate([...pipeline, { $count: 'total' }]),
  ]);

  const total = totalResult[0]?.total || 0;

  return {
    data,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
  };
}
