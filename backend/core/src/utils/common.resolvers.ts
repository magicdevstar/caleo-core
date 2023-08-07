export interface SearchResults<T> {
  items: T[];
  total: number;
}

export const commonResolvers = {
  createdAt: (item) => new Date(item.createdAt).toISOString(),
  updatedAt: (item) => new Date(item.updatedAt).toISOString(),
}