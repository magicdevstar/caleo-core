export interface SearchResults<T> {
  items: T[];
  total: number;
}

export const commonResolvers = {
  id: (item) => item.id || item._id?.toString(),
  createdAt: (item) => new Date(item.createdAt).toISOString(),
  updatedAt: (item) => new Date(item.updatedAt).toISOString(),
}