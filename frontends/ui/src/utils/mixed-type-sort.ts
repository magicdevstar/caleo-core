import orderBy from 'lodash/orderBy';
import get from 'lodash/get';

export const mixedTypeSort = (data: any, options: any) => {
  if (options?.orderBy) {
    return {
      total: data.length,
      items: orderBy<any>(
        data,
        [
          v => Number.isNaN(Number(get(v, options.orderBy!))),
          v => (Number.isNaN(Number(get(v, options.orderBy!))) ? get(v, options.orderBy!) : Number(get(v, options.orderBy!)))
        ],
        [
          options?.order || 'asc' as any,
          options?.order || 'asc' as any
        ]
      ),
    };
  }
  return {
    total: data.length,
    items: data,
  };
};
