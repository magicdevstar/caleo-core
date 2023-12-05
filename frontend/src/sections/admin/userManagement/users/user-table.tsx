import { useCallback, useState } from "react";
import { useMutation } from "@apollo/client";
import { useSnackbar } from "notistack";
import { useNavigate } from "react-router";
// @mui
import LoadingButton from "@mui/lab/LoadingButton";
import red from "@mui/material/colors/red";
// Types
import { MemberStatus, MemberTier, User } from "src/__generated__/resolvers-types";
import GQLTable from "src/components/table/gql/table"
// Components
import { TableConfig, getBooleanFilters, getStatusFilter, getTierFilter } from "src/components/table/table-config"
import { GET_USERS, REMOVE_USER } from "src/api/user";
import { ConfirmDialog } from "src/components/custom-dialog";
import { useBoolean } from "src/hooks/use-boolean";
import { client } from "src/utils/apollo";
import { GET_RANKS } from "src/api/rank";
import StatusConfirmDialog from "./deactivate-confirm-dialog";

export default function UserTable() {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [removeUser, setRemoveUser] = useState<User | null>(null);
  const [status, setStatus] = useState<{
    user: User;
    status: MemberStatus.Active | MemberStatus.Inactive;
  } | null>(null);
  const deleteConfirm = useBoolean();
  const statusConfirm = useBoolean();
  const [removeUserMutation, { loading }] = useMutation(REMOVE_USER, {
    refetchQueries: [GET_USERS],
  });
  const config: TableConfig<User> = {
    header: {
      title: 'Users',
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
        getName: () => 'Edit',
        getIcon: () => 'solar:pen-bold',
        onClick: (row: User) => {
          navigate(`/dashboard/admin/users/${row.id}`);
        },
      },
      {
        getName: () => 'Deactivate',
        getIcon: () => 'solar:close-circle-bold',
        getColor: () => red[500],
        getHidden: (row: User) => row.member.status === MemberStatus.Inactive,
        onClick: (row: User) => {
          setStatus({
            user: row,
            status: MemberStatus.Inactive,
          });
          statusConfirm.onTrue();
        },
      },
      {
        getName: () => 'Reactivate',
        getIcon: () => 'solar:check-circle-bold',
        getHidden: (row: User) => row.member.status !== MemberStatus.Inactive,
        onClick: (row: User) => {
          setStatus({
            user: row,
            status: MemberStatus.Active,
          });
          statusConfirm.onTrue();
        },
      },
      {
        getName: () => 'Delete',
        getIcon: () => 'solar:trash-bin-trash-bold',
        getColor: () => red[500],
        onClick: (user: User) => {
          setRemoveUser(user);
          deleteConfirm.onTrue();
        },
      }
    ],
    columns: [
      {
        id: 'name',
        label: 'Name',
        columnType: 'string',
        renderValue: (_val, _index, row: User) => {
          if (row.name) {
            return row.name;
          }
          return `${row.member.contactInfo?.primaryEmail.address || '-'}`;
        },
        getHref: (row) => {
          if (row.name) {
            return `/dashboard/admin/users/${row.id}`;
          }
          return window.location.pathname;
        }
      },
      {
        id: 'member.pNumber',
        label: 'P#',
        width: 200,
        columnType: 'string',
        renderValue: (val) => val || '-',
      },
      { id: 'member.rank.name', label: 'Rank', width: 160, columnType: 'string', noSort: true },
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
      {
        id: 'rankIds',
        type: 'autocomplete',
        label: 'Rank',
        autoComplete: {
          multiSelect: true,
          inputLabel: 'Rank',
          inputPlaceholder: 'Search...',
          limitTags: 1,
        },
        async fetchOptions (query?: string) {
          const { data } = await client.query({
            query: GET_RANKS,
            variables: {
              input: {
                query,
                limit: 10,
                skip: 0,
              },
            },
          });
          const formattedOptions = data?.ranks?.items?.map(({ id, name }: any) => ({ value: id, label: name })) || [];
          return formattedOptions;
        },
      },
    ]
  };

  const handleDeleteRow = useCallback(async () => {
    try {
      await removeUserMutation({
        variables: {
          id: removeUser!.id,
        },
      });

      setRemoveUser(null);
      deleteConfirm.onFalse();
      enqueueSnackbar('Successfully remove user!', {
        variant: 'success',
        autoHideDuration: 4000,
      });
    } catch(error) {
      enqueueSnackbar('Failed to remove user. Please try again later.', {
        variant: 'error',
        autoHideDuration: 4000,
      });
    }
  }, [
    removeUserMutation,
    setRemoveUser,
    enqueueSnackbar,
    removeUser,
    deleteConfirm,
  ]);

  return (
    <>
      <GQLTable config={config} />

      <StatusConfirmDialog
        statusConfirm={statusConfirm}
        user={status?.user}
        status={status?.status}
      />
      <ConfirmDialog
          open={deleteConfirm.value}
          onClose={deleteConfirm.onFalse}
          title="Delete"
          content="Are you sure want to delete?"
          action={
            <LoadingButton loading={loading} variant="contained" color="error" onClick={handleDeleteRow}>
              Delete
            </LoadingButton>
          }
      />
    </>
  )
};
