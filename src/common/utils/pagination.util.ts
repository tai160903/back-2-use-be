import { Model } from 'mongoose';

export async function paginate<T>(
  model: Model<T>,
  filter: any,
  page: number,
  limit: number,
  select?: string,
  sort: Record<string, 1 | -1> = { createdAt: -1 },
) {
  const query = model.find(filter as any);

  if (select) {
    query.select(select);
  }

  const [data, total] = await Promise.all([
    query
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .exec(),
    model.countDocuments(filter as any),
  ]);

  return {
    data,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
  };
}
