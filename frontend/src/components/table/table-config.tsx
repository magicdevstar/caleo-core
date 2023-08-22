import { DocumentNode } from "graphql";
import { MemberStatus, MemberTier } from "src/__generated__/resolvers-types";

export interface TableConfig<T> {
  header: {
    title: string;
    button?: {
      text: string;
      icon: string;
      disabled?: boolean;
      onClick: () => void;
    },
  },
  table?: {
    minWidth?: number | string;
  },
  search: {
    data?: T[],
    loading?: boolean;
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
    width?: number | string;
    noSort?: boolean;
    columnType: 'string' | 'date' | 'boolean' | 'array' | 'action';
    maxRender?: number;
    renderValue?: (row: any, index: number) => any;
    getLabelColor?: (row: T) => string;
    getHref?: (row: T) => string;
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

export const getStatusFilter = () => [
  { value: MemberStatus.Active, label: 'Active' },
  { value: MemberStatus.Inactive, label: 'InActive' },
  { value: MemberStatus.Pending, label: 'Pending' },
  { value: MemberStatus.Removed, label: 'Removed' },
  { value: MemberStatus.Deleted, label: 'Deleted' },
];

export const getTierFilter = () => [
  { value: MemberTier.Tier_1, label: 'Tier 1' },
  { value: MemberTier.Tier_2, label: 'Tier 2' },
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
