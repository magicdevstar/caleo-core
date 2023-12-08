import { useState } from "react";
import copy from 'copy-to-clipboard';
import { useSnackbar } from 'notistack';
import { capitalize } from "lodash";
// @mui
import red from "@mui/material/colors/red";
// Types
import { MemberStatus, User } from "src/__generated__/resolvers-types";
import { GET_ACCOUNT_REQUEST_USERS } from "src/api/user";

// Hooks
import { useBoolean } from "src/hooks/use-boolean";
import { useAuthContext } from 'src/auth/hooks';

// Components
import { TableConfig } from "src/components/table/table-config"
import GQLTable from "src/components/table/gql/table"
import AccountRequestsDialog from "./account-requests-dialog";

export default function AccountRequestsTable() {
  const [userRequest, setUserRequest] = useState<{ user: User, approve: boolean } | null>(null);
  const reviewUser = useBoolean();
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
      query: GET_ACCOUNT_REQUEST_USERS,
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
        onClick: (row: User) => {
          setUserRequest({
            user: row,
            approve: true
          });
          reviewUser.onTrue();
        },
      },
      {
        getName: () => 'Deny',
        getIcon: () => 'solar:close-circle-bold',
        getColor: (row: User) => red[500],
        onClick: (row: User) => {
          setUserRequest({
            user: row,
            approve: false,
          });
          reviewUser.onTrue();
        },
      }
    ],
    columns: [
      {
        id: 'name',
        label: 'Name',
        columnType: 'string',
        getHref: (row) => `/dashboard/admin/users/${row.id}`
      },
      { id: 'member.contactInfo.primaryEmail.address', label: 'Email', columnType: 'string' },
      {
        id: 'member.status',
        label: 'Status',
        width: 110,
        columnType: 'string',
        renderValue: (memberStatus) => capitalize(memberStatus),
        getLabelColor: (row) => {
          switch(row.member.status) {
            case MemberStatus.Active:
              return 'success';
            case MemberStatus.Invited:
              return 'info'
            case MemberStatus.Pending:
              return 'warning';
            case MemberStatus.Removed:
              return 'error';
            case MemberStatus.Inactive:
            default:
              return 'default';
          }
        }
      },
      { id: '', width: 88, columnType: 'action', label: '' },
    ],
    filters: [
      {
        id: 'statuses',
        type: 'hidden',
        label: 'Status',
        defaultValue: [MemberStatus.Pending],
        value: [MemberStatus.Pending],
      }
    ]
  };

  return (
    <>
      <GQLTable config={config} />

      <AccountRequestsDialog userRequest={userRequest} open={reviewUser.value} onClose={reviewUser.onFalse} />
    </>
  )
};
