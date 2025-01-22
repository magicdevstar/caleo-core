import { m } from 'framer-motion';
import { useState, useCallback, useMemo } from 'react';
import { useMutation, useQuery } from '@apollo/client';
// @mui
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import List from '@mui/material/List';
import Stack from '@mui/material/Stack';
import Badge from '@mui/material/Badge';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
// hooks
import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';
// components
import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { varHover } from 'src/components/animate';
import NotificationItem, { NotificationRendered } from 'src/layouts/_common/notifications-popover/notification-item';
//
import {
  GET_IN_APP_NOTIFICATIONS,
  MARK_ALL_AS_SEEN,
  REMOVE_ALL_NOTIFICATIONS,
  GET_ACTIVE_NOTIFICATIONS
} from 'src/api/notification';
import { InAppNotifications, Notification } from 'src/__generated__/resolvers-types';
import { notificationRouterPath } from 'src/utils/notificationRouterPath';
import { clearNotifications } from 'src/hooks/use-browser-notification';

// ----------------------------------------------------------------------

let inAppNotificationData: any;
let inAppTotalMessages: number = 0;

export default function NotificationsPopover() {
  const drawer = useBoolean();

  const smUp = useResponsive('up', 'sm');
  const [currentTab, setCurrentTab] = useState('all');

  const handleChangeTab = useCallback((event: React.SyntheticEvent, newValue: string) => {
    setCurrentTab(newValue);
  }, []);

  const [markAsSeen, { loading: markingAsSeenLoading }] = useMutation(MARK_ALL_AS_SEEN, {
    refetchQueries: [GET_IN_APP_NOTIFICATIONS],
  });
  const [removeAll, { loading: removeAllLoading }] = useMutation(REMOVE_ALL_NOTIFICATIONS, {
    refetchQueries: [GET_IN_APP_NOTIFICATIONS],
  });
  const { data: queryData, loading } = useQuery(GET_IN_APP_NOTIFICATIONS, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    pollInterval: 1000 * 20, // Poll every 20 seconds
    variables: {
      input: {
        limit: 20,
        ...(currentTab === 'unread' && { read: false }),
      },
    },
  });
  const {
    data: legacyNotifications,
  } = useQuery(GET_ACTIVE_NOTIFICATIONS, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
  });

  const data = useMemo(() => {
    if (queryData?.inAppNotifications) {
      inAppNotificationData = queryData;
    }
    return inAppNotificationData;
  }, [queryData]);
  const totalMessages = useMemo(() => {
    if (queryData?.inAppNotifications?.total) {
      inAppTotalMessages = queryData.inAppNotifications.total;
    }
    return inAppTotalMessages;
  }, [queryData?.inAppNotifications?.total]);


  const totalUnRead = useMemo(() => {
    if (loading) {
      return (<CircularProgress size={11} sx={{ color: 'white' }} thickness={7} />);  
    }

    return (data?.inAppNotifications?.unreadCount || 0);
  }, [
    loading,
    data?.inAppNotifications,
  ]);

  const tabs = useMemo(() => [
    {
      value: 'all',
      label: 'All',
      count: totalMessages,
    },
    {
      value: 'unread',
      label: 'Unread',
      count: data?.inAppNotifications?.unreadCount || 0,
    },
    {
      value: 'system',
      label: 'System',
      count: legacyNotifications?.activeNotifications?.items?.length || 0,
    },
  ], [totalMessages, data?.inAppNotifications, legacyNotifications]);

  const notificationList = useMemo(() => {
    let list = data?.inAppNotifications?.items || [];
    if (currentTab === 'system') {
      list = legacyNotifications?.activeNotifications?.items || [];
    }
    return list.map((notification: InAppNotifications | Notification) => ({
      id: notification.id,
      title: notification.title,
      body: notification.body,
      createdAt: notification.createdAt as any,
      isUnRead: notification.__typename === 'Notification' ? false : !(notification as InAppNotifications).read,
      type: 'mail',
      drawer,
      notificationAction: notification.__typename === 'Notification' ? null : notificationRouterPath((notification as InAppNotifications).templateName, (notification as InAppNotifications).meta!),
      avatarUrl: null,
      onClick: () => {
        if (notification.__typename !== 'Notification') {
          markAsSeen({
            variables: {
              ids: [notification.id],
            },
          });
          clearNotifications();
        }
      }
    } as NotificationRendered));
  }, [
    currentTab,
    drawer,
    legacyNotifications?.activeNotifications,
    data?.inAppNotifications,
    markAsSeen,
  ]);

  const handleMarkAllAsRead = useCallback(() => {
    clearNotifications();
    markAsSeen({
      variables: {
        readAll: true,
      },
    });
  }, [markAsSeen]);

  const handleRemoveAll = useCallback(() => {
    inAppTotalMessages = 0;
    clearNotifications();
    removeAll({
      variables: {
        removeAll: true,
      },
    });
  }, [removeAll]);

  const renderHead = (
    <Stack direction="row" alignItems="center" sx={{ py: 2, pl: 2.5, pr: 1, minHeight: 68 }}>
      <Typography variant="h6" sx={{ flexGrow: 1 }}>
        Notifications
      </Typography>

      <Tooltip title="Mark all as read">
        <IconButton disabled={markingAsSeenLoading} color="info" onClick={handleMarkAllAsRead}>
          <Iconify icon={markingAsSeenLoading ? "svg-spinners:180-ring-with-bg" : "eva:done-all-fill"} />
        </IconButton>
      </Tooltip>

      {!smUp && (
        <IconButton onClick={drawer.onFalse}>
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      )}
    </Stack>
  );

  const renderTabs = (
    <Tabs value={currentTab} onChange={handleChangeTab}>
      {tabs.map((tab) => (
        <Tab
          key={tab.value}
          iconPosition="end"
          value={tab.value}
          label={tab.label}
          icon={
            <Label
              variant={((tab.value === 'all' || tab.value === currentTab) && 'filled') || 'soft'}
              color={
                (tab.value === 'unread' && 'info') ||
                (tab.value === 'archived' && 'success') ||
                'default'
              }
            >
              {tab.count}
            </Label>
          }
          sx={{
            '&:not(:last-of-type)': {
              mr: 3,
            },
          }}
        />
      ))}
    </Tabs>
  );

  const renderList = (
    <Scrollbar>
      <List disablePadding>
        {notificationList.map((notification: NotificationRendered) => (
          <NotificationItem key={notification.id} notification={notification} />
        ))}
      </List>
    </Scrollbar>
  );

  return (
    <>
      <IconButton
        component={m.button}
        whileTap="tap"
        whileHover="hover"
        variants={varHover(1.05)}
        color={drawer.value ? 'primary' : 'default'}
        onClick={drawer.onTrue}
      >
        <Badge badgeContent={totalUnRead} color="error">
          <Iconify icon="solar:bell-bing-bold-duotone" width={24} />
        </Badge>
      </IconButton>

      <Drawer
        open={drawer.value}
        onClose={drawer.onFalse}
        anchor="right"
        slotProps={{
          backdrop: { invisible: true },
        }}
        PaperProps={{
          sx: { width: 1, maxWidth: 420 },
        }}
      >
        {renderHead}

        <Divider />

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ pl: 2.5, pr: 1 }}
        >
          {renderTabs}
          <Tooltip title="Clear all notifications">
            <IconButton disabled={removeAllLoading} color="info" onClick={handleRemoveAll}>
              <Iconify icon={removeAllLoading ? "svg-spinners:180-ring-with-bg" : "eva:trash-2-fill"} />
            </IconButton>
          </Tooltip>
        </Stack>

        <Divider />

        { notificationList.length === 0 ? (
          <Stack alignItems="center" justifyContent="center" sx={{ p: 2, mt: 4 }}>
            <Typography variant='body1'>No notifications</Typography>
          </Stack>
        ) : renderList}
      </Drawer>
    </>
  );
}
