import { DocumentNode } from "graphql";

export interface TableConfig<T> {
  header: {
    title: string;
    button?: {
      text: string;
      icon: string;
      onClick: () => void;
    },
  },
  search: {
    query: DocumentNode;
    processResult: (value: any) => {
      items: T[];
      total: number;
    };
  }
  rowActions: {
    getName: (row: T) => any;
    getIcon: (row: T) => any;
    onClick: (row: T) => any;
  }[];
  columns: {
    id: string;
    label: string;
    width?: number;
    noSort?: boolean;
    columnType: 'string' | 'date' | 'boolean' | 'array' | 'action';
    maxRender?: number;
    renderValue?: (row: any) => any;
    getLabelColor?: (row: T) => string;
  }[];
  filters: {
    id: string;
    type: 'select' | 'text' | 'boolean';
    label: string;
    defaultValue: any;
    value: any;
    fetchOptions?: () => {
      value: any;
      label: string;
    }[],
    resolveAsBoolean?: boolean,
  }[];
}

export interface Filter {
  id: string;
  type: 'select' | 'text' | 'boolean';
  label: string;
  defaultValue: any;
  value: any;
  fetchOptions?: () => {
    value: any;
    label: string;
  }[],
  resolveAsBoolean?: boolean,
}

export const getBooleanFilters = () => [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

export const resolveFilterValue = (filter: Filter) => {
  if (JSON.stringify(filter.value) === JSON.stringify(filter.defaultValue)) {
    return undefined;
  }
  if (filter.resolveAsBoolean && filter.type === 'select') {
    if (filter.value.length > 1) return undefined;
    if (filter.value[0] === 'yes') return true;
    return false;
  }
  return filter.value;
};
