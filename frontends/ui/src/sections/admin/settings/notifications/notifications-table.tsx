import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
// @mui
import Button from '@mui/material/Button';
// @apollo/client
import { useMutation } from '@apollo/client';
// hooks
import { useBoolean } from 'src/hooks/use-boolean';
// components
import GQLTable from 'src/components/table/gql/table';
import { ConfirmDialog } from 'src/components/custom-dialog';
// types
import { Notification } from 'src/__generated__/resolvers-types';
import { GET_ACTIVE_NOTIFICATIONS, GET_ALL_NOTIFICATIONS, REMOVE_NOTIFICATION, UPSERT_NOTIFICATION } from 'src/api/notification';
import { getBooleanFilters, TableConfig } from 'src/components/table/table-config';


// ----------------------------------------------------------------------

export default function NotificationTable() {
  const navigate = useNavigate();

  const [updateNotification] = useMutation(UPSERT_NOTIFICATION, {
    refetchQueries: [GET_ALL_NOTIFICATIONS, GET_ACTIVE_NOTIFICATIONS],
  });

  const [removeNotification] = useMutation(REMOVE_NOTIFICATION, {
    refetchQueries: [GET_ALL_NOTIFICATIONS, GET_ACTIVE_NOTIFICATIONS],
  });

  const [editNotification, setEditNotification] = useState<Notification | null>(null);
  const deleteConfirm = useBoolean();

  const config: TableConfig<Notification> = {
    header: {
      title: 'Notifications',
      button: {
        text: 'Add Notification',
        icon: 'ic:baseline-add',
        onClick: () => {
          navigate('/dashboard/admin/settings/notifications/new');
        },
      }
    },
    search: {
      defaultTableConfig: {
        defaultRowsPerPage: 10,
      },
      query: GET_ALL_NOTIFICATIONS,
      processResult: (data: any) => {
        const { notifications: { items, total } } = data || { notifications: { items: [], total: 0 } };
        return {
          total,
          items,
        };
      }
    },
    table: {
      toolbar: {
        lg: 6,
      }
    },
    rowActions: [
      {
        getName: () => 'Edit',
        getIcon: () => 'solar:pen-bold',
        onClick: (row: Notification) => {
          navigate(`/dashboard/admin/settings/notifications/${row.id}`);
        },
      },
      {
        getName: (row: Notification) => row.active ? 'Deactivate' : 'Activate',
        getIcon: (row: Notification) => row.active ? 'solar:close-circle-bold' : 'solar:check-circle-bold',
        onClick: async (notification: Notification) => {
          updateNotification({
            variables: {
              input: {
                id: notification.id,
                title: notification.title,
                active: !notification.active,
              },
            },
          });
        },
      },
      {
        getName: () => 'Delete',
        getIcon: () => 'solar:trash-bin-trash-bold',
        onClick: (notification: Notification) => {
          setEditNotification(notification);
          deleteConfirm.onTrue();
        },
      }
    ],
    columns: [
      {
        id: 'title',
        label: 'Title',
        columnType: 'string',
        getHref: (row) => `/dashboard/admin/settings/notifications/${row.id}`,
      },
      { id: 'createdBy.name', label: 'Created by', width: 110, columnType: 'string' },
      { id: 'active', label: 'Active', width: 110, columnType: 'boolean' },
      { id: 'createdAt', label: 'Created at', width: 160, columnType: 'date' },
      { id: 'updatedAt', label: 'Updated at', width: 160, columnType: 'date' },
      { id: '', width: 88, columnType: 'action', label: '' },
    ],
    filters: [
      {
        id: 'active',
        type: 'select',
        label: 'Active',
        defaultValue: [],
        value: [],
        fetchOptions: getBooleanFilters,
        resolveAsBoolean: true,
      },
      {
        id: 'title',
        type: 'text',
        label: 'Search',
        defaultValue: '',
        value: '',
      },
    ]
  };

  const handleDeleteRow = useCallback(
    () => {
      removeNotification({
        variables: {
          id: editNotification?.id,
        },
      }).then(() => {
        setEditNotification(null);
        deleteConfirm.onFalse();
      });
    },
    [removeNotification, editNotification, setEditNotification, deleteConfirm]
  );

  return (
    <>
      <GQLTable config={config} />

      <ConfirmDialog
        open={deleteConfirm.value}
        onClose={deleteConfirm.onFalse}
        title="Delete"
        content="Are you sure want to delete?"
        action={
          <Button variant="contained" color="error" onClick={handleDeleteRow}>
            Delete
          </Button>
        }
      />
    </>
  )
};


