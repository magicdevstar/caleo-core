import { DocumentNode } from "graphql";
import { MemberStatus, MemberTier } from "src/__generated__/resolvers-types";

export interface TableConfig<T> {
  header: {
    title: string;
    buttons?: {
      key: string;
      text: string;
      icon: string;
      variant?: string;
      loading?: boolean;
      disabled?: boolean;
      onClick: () => void;
    }[],
    button?: {
      text: string;
      icon: string;
      loading?: boolean;
      disabled?: boolean;
      onClick: () => void;
    },
  },
  tabs?: {
    default: string;
    items: {
      value: string;
      onClick: (setAllFilters: (values: {id: string, value: any}[]) => void) => void;
    }[]
  },
  table?: {
    sx?: {
      minWidth?: number | string;
    }
  },
  search: {
    data?: T[],
    loading?: boolean;
    query: DocumentNode;
    defaultTableConfig?: {
      defaultRowsPerPage?: number;
      defaultOrderBy?: string;
      defaultOrder?: 'asc' | 'desc';
    }
    processResult: (value: any) => {
      items: T[];
      total: number;
    };
  }
  rowActions: {
    getDisabled?: (row: T) => boolean;
    getName: (row: T) => any;
    getIcon: (row: T) => any;
    onClick: (row: T) => any;
    getColor?: (row: T) => string;
  }[];
  columns: {
    id: string;
    label: string;
    width?: number | string;
    noSort?: boolean;
    columnType: 'string' | 'date' | 'boolean' | 'array' | 'action';
    maxRender?: number;
    emptyArrayLabel?: string;
    renderValue?: (value: any, index: number, row: T) => any;
    getLabelColor?: (row: T) => string;
    getHref?: (row: T) => string;
    onClick?: (row: T) => void;
    clickable?: (row: T) => boolean;
  }[];
  filters: Filter[];
}

export interface Filter {
  id: string;
  type: 'select' | 'text' | 'boolean' | 'hidden' | 'hiddenValue';
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
  if (filter.type === 'hidden') return filter.defaultValue;
  if (filter.type === 'hiddenValue') return filter.value;
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
