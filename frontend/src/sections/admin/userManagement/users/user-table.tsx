// Types
import { MemberStatus, MemberTier, User } from "src/__generated__/resolvers-types";
import GQLTable from "src/components/table/gql/table"
// Components
import { TableConfig } from "src/components/table/table-config"
import { GET_USERS } from "src/api/user";

export default function UserTable() {
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
        onClick: (row: User) => {},
      },
      {
        getName: () => 'Delete',
        getIcon: () => 'solar:trash-bin-trash-bold',
        onClick: (user: User) => {},
      }
    ],
    columns: [
      { id: 'name', label: 'Name', columnType: 'string' },
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
        id: 'name',
        type: 'text',
        label: 'Name',
        defaultValue: '',
        value: '',
      },
    ]
  };

  return (
    <GQLTable config={config} />
  )
};
