import { useNavigate } from "react-router";
// Types
import { MemberStatus, MemberTier, User } from "src/__generated__/resolvers-types";
import GQLTable from "src/components/table/gql/table"
// Components
import { TableConfig, getBooleanFilters, getStatusFilter, getTierFilter } from "src/components/table/table-config"
import { GET_USERS } from "src/api/user";

export default function UserTable() {
  const navigate = useNavigate();
  const config: TableConfig<User> = {
    header: {
      title: 'Users',
    },
    search: {
      query: GET_USERS,
      processResult: (data) => {
        const { users: { items, total } } = data || { users: { items: [], total: 0 } };
        return {
          total,
          items,
        };
      }
    },
    rowActions: [
      {
        getName: () => 'Edit',
        getIcon: () => 'solar:pen-bold',
        onClick: (row: User) => {
          navigate(`/dashboard/admin/users/${row.id}`);
        },
      },
      {
        getName: () => 'Delete',
        getIcon: () => 'solar:trash-bin-trash-bold',
        onClick: (user: User) => {},
      }
    ],
    columns: [
      {
        id: 'name',
        label: 'Name',
        columnType: 'string',
        getHref: (row) => `/dashboard/admin/users/${row.id}`
      },
      { id: 'member.pNumber', label: 'P#', width: 200, columnType: 'string' },
      { id: 'member.rank.name', label: 'Rank', width: 160, columnType: 'string' },
      {
        id: 'member.tier',
        label: 'Tier',
        width: 160,
        columnType: 'string',
        renderValue: (tier: MemberTier) => {
          switch(tier) {
            case MemberTier.Tier_2:
              return 'Tier 2';
            case MemberTier.Tier_1:
            default:
              return 'Tier 1';
          }
        }
      },
      { id: 'member.status', label: 'Status', width: 110, columnType: 'string', getLabelColor: (row) => {
        switch(row.member.status) {
          case MemberStatus.Inactive:
            return 'default';
          case MemberStatus.Active:
          default:
            return 'info';
        }
      }},
      { id: 'createdAt', label: 'Create at', width: 160, columnType: 'date' },
      { id: '', width: 88, columnType: 'action', label: '' },
    ],
    filters: [
      {
        id: 'query',
        type: 'text',
        label: 'Name',
        defaultValue: '',
        value: '',
      },
      {
        id: 'pNumber',
        type: 'text',
        label: 'P#',
        defaultValue: '',
        value: '',
      },
      {
        id: 'phone',
        type: 'text',
        label: 'Phone Number',
        defaultValue: '',
        value: '',
      },
      {
        id: 'email',
        type: 'text',
        label: 'Email',
        defaultValue: '',
        value: '',
      },
      {
        id: 'statuses',
        type: 'select',
        label: 'Status',
        defaultValue: [],
        value: [],
        fetchOptions: getStatusFilter,
      },
      {
        id: 'tiers',
        type: 'select',
        label: 'Tier',
        defaultValue: [],
        value: [],
        fetchOptions: getTierFilter,
      },
      {
        id: 'admin',
        type: 'select',
        label: 'Admin',
        defaultValue: [],
        value: [],
        fetchOptions: getBooleanFilters,
        resolveAsBoolean: true,
      },
    ]
  };

  return (
    <GQLTable config={config} />
  )
};
