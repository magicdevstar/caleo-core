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
    },
    toolbar?: ToolbarConfig;
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
  type: 'select' | 'autocomplete' | 'dateRange' | 'text' | 'boolean' | 'hidden' | 'hiddenValue' | 'number';
  dateRangeType?: 'start' | 'end';
  label?: string;
  defaultValue?: any;
  sizing?: ToolbarConfig;
  autoComplete?: {
    multiSelect?: boolean;
    inputLabel?: string;
    inputPlaceholder?: string;
  };
  value?: any;
  // This will be used to store the options once they are queried
  calculatedOptions?: any[];
  fetchOptions?: (query?: string) => Promise<{
    value: any;
    label: string;
  }[]>,
  resolveAsBoolean?: boolean,
}

export interface ToolbarConfig {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
}

export const getBooleanFilters = () => Promise.resolve([
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]);

export const getStatusFilter = () => Promise.resolve([
  { value: MemberStatus.Active, label: 'Active' },
  { value: MemberStatus.Inactive, label: 'In Active' },
  { value: MemberStatus.Pending, label: 'Pending' },
  { value: MemberStatus.Invited, label: 'Invited' },
  { value: MemberStatus.Removed, label: 'Removed' },
]);

export const getTierFilter = () => Promise.resolve([
  { value: MemberTier.Tier_1, label: 'Tier 1' },
  { value: MemberTier.Tier_2, label: 'Tier 2' },
]);

export const resolveFilterValue = (filter: Filter) => {
  if (filter.type === 'hidden') return filter.defaultValue;
  if (filter.type === 'hiddenValue') return filter.value;
  if (filter.type === 'dateRange') {
    if (Array.isArray(filter.value) && filter.value.length === 2) {
      const [start, end] = filter.value;
      const key = filter.dateRangeType === 'start' ? 'startTime' : 'endTime';
      return {
        [key]: {
          gte: start.toDate().toISOString(),
          lte: end.toDate().toISOString(),
        },
      };
    }
    return undefined;
  }
  if (JSON.stringify(filter.value) === JSON.stringify(filter.defaultValue)) {
    return undefined;
  }
  if (filter.resolveAsBoolean && filter.type === 'select') {
    if (filter.value.length > 1) return undefined;
    if (filter.value[0] === 'yes') return true;
    return false;
  }
  if (filter.type === 'autocomplete') {
    if (Array.isArray(filter.value) && filter.value.length === 0) return undefined;
    return filter.value.map((v: any) => v.value);
  }
  if (filter.type === 'select') {
    if (Array.isArray(filter.value) && filter.value.length === 0) return undefined;
  }
  return filter.value;
};
