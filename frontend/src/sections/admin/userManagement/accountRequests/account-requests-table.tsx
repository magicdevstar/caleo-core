import copy from 'copy-to-clipboard';
import { useSnackbar } from 'notistack';
// @mui
import red from "@mui/material/colors/red";
// Types
import { MemberStatus, User } from "src/__generated__/resolvers-types";
import GQLTable from "src/components/table/gql/table"
// Hooks
import { useAuthContext } from 'src/auth/hooks';
// Components
import { TableConfig } from "src/components/table/table-config"
import { GET_USERS } from "src/api/user";

export default function AccountRequestsTable() {
  const { enqueueSnackbar } = useSnackbar();
  const { user: loggedInUser } = useAuthContext();
  const config: TableConfig<User> = {
    header: {
      title: 'Account Requests',
      button: {
        text: 'Copy Invite Link',
        icon: 'mdi:content-copy',
        onClick: () => {
          copy(`${window.location.origin}/auth/register?orgId=${loggedInUser?.member?.org?.id}`);
          enqueueSnackbar('Invite link copied to clipboard', { variant: 'success', autoHideDuration: 3000 });
        }
      },
    },
    search: {
      defaultTableConfig: {
        defaultRowsPerPage: 10,
      },
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
        getName: () => 'Approve',
        getIcon: () => 'solar:check-circle-bold',
        onClick: (row: User) => {},
      },
      {
        getName: () => 'Deny',
        getIcon: () => 'solar:close-circle-bold',
        getColor: (row: User) => red[500],
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
      { id: 'member.contactInfo.primaryEmail.address', label: 'Email', width: 200, columnType: 'string' },
      { id: 'member.status', label: 'Status', width: 110, columnType: 'string', getLabelColor: (row) => {
        switch(row.member.status) {
          case MemberStatus.Inactive:
            return 'default';
          case MemberStatus.Active:
          default:
            return 'info';
        }
      }},
      { id: '', width: 88, columnType: 'action', label: '' },
    ],
    filters: [
      {
        id: 'statuses',
        type: 'hidden',
        label: 'Status',
        defaultValue: [MemberStatus.Pending],
        value: [MemberStatus.Pending],
        // fetchOptions: getStatusFilter,
      }
    ]
  };

  return (
    <GQLTable config={config} />
  )
};
