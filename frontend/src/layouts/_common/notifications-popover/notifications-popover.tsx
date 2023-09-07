import { m } from 'framer-motion';
import { useState, useCallback, useMemo } from 'react';
import { useMutation, useQuery } from '@apollo/client';
// @mui
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import List from '@mui/material/List';
import Button from '@mui/material/Button';
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
import Markdown from 'src/components/markdown';
import { ConfirmDialog } from 'src/components/custom-dialog';
import NotificationItem, { NotificationRendered } from 'src/layouts/_common/notifications-popover/notification-item';
//
import { GET_ACTIVE_NOTIFICATIONS, MARK_ALL_AS_SEEN } from 'src/api/notification';
import { Notification, NotificationFrequency } from 'src/__generated__/resolvers-types';

// ----------------------------------------------------------------------

const NotificationMap = {
  [NotificationFrequency.Always]: 'Persistent Notification',
  [NotificationFrequency.UntilExpire]: 'Temporary Notification',
  [NotificationFrequency.Once]: 'Notification',
}

// ----------------------------------------------------------------------

export default function NotificationsPopover() {
  const drawer = useBoolean();
  const [notificationDetail, setNotificationDetail] = useState<Notification | undefined>();
  const showDetail = useBoolean();

  const smUp = useResponsive('up', 'sm');
  const [currentTab, setCurrentTab] = useState('all');

  const handleChangeTab = useCallback((event: React.SyntheticEvent, newValue: string) => {
    setCurrentTab(newValue);
  }, []);

  const [markAsSeen] = useMutation(MARK_ALL_AS_SEEN, {
    refetchQueries: [GET_ACTIVE_NOTIFICATIONS],
  });
  const { data, loading } = useQuery(GET_ACTIVE_NOTIFICATIONS);

  const totalUnRead = loading ? (<CircularProgress size={11} sx={{ color: 'white' }} thickness={7} />) : data?.activeNotifications?.items?.filter(({ seen, frequency }: Notification) => !seen || frequency === NotificationFrequency.Always)?.length;

  const notificationIds = useMemo(() =>
    data?.activeNotifications?.items?.map(({ id }: Notification) => id) || [],
  [data?.activeNotifications]);
  const tabs = useMemo(() => [
    {
      value: 'all',
      label: 'All',
      count: data?.activeNotifications?.total || 0,
    },
    {
      value: 'unread',
      label: 'Unread',
      count: data?.activeNotifications?.items?.filter(({ seen, frequency }: Notification) => !seen && frequency !== NotificationFrequency.Always).length || 0,
    },
    {
      value: 'always',
      label: 'Persistent',
      count: data?.activeNotifications?.items?.filter(({ frequency }: Notification) => frequency === NotificationFrequency.Always).length || 0,
    },
  ], [data?.activeNotifications]);

  const notificationList = useMemo(() => {
    let list = data?.activeNotifications?.items || [];
    if (currentTab === 'unread') {
      list = data?.activeNotifications?.items?.filter(({ seen }: Notification) => !seen) || [];
    } else if (currentTab === 'always') {
      list = data?.activeNotifications?.items?.filter(({ frequency }: Notification) => frequency === NotificationFrequency.Always) || [];
    }
    return list.map((notification: Notification) => ({
      id: notification.id as any,
      title: notification.title as any,
      body: notification.body.length > 250 ? `${notification.body.slice(0, 250)}...` : notification.body as any,
      category: NotificationMap[notification.frequency],
      createdAt: notification.updatedAt as any,
      isUnRead: !notification.seen && notification.frequency !== NotificationFrequency.Always,
      type: 'mail',
      avatarUrl: null,
      onClick: () => {
        markAsSeen({
          variables: {
            ids: [notification.id],
          },
        });
        showDetail.onTrue();
        setNotificationDetail(notification);
      }
    } as NotificationRendered));
  }, [
    currentTab,
    data?.activeNotifications,
    showDetail,
    setNotificationDetail,
    markAsSeen,
  ]);

  const handleMarkAllAsRead = useCallback(() => {
    if (notificationIds.length > 0) {
      markAsSeen({
        variables: {
          ids: notificationIds,
        }
      });
    }
  }, [markAsSeen, notificationIds]);

  const handleCloseDetail = useCallback(() => {
    showDetail.onFalse();
    // For animation
    setTimeout(() => {
      setNotificationDetail(undefined);
    }, 200);
  }, [showDetail, setNotificationDetail]);

  const renderHead = (
    <Stack direction="row" alignItems="center" sx={{ py: 2, pl: 2.5, pr: 1, minHeight: 68 }}>
      <Typography variant="h6" sx={{ flexGrow: 1 }}>
        Notifications
      </Typography>

      {!!totalUnRead && (
        <Tooltip title="Mark all as read">
          <IconButton color="primary" onClick={handleMarkAllAsRead}>
            <Iconify icon="eva:done-all-fill" />
          </IconButton>
        </Tooltip>
      )}

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
          {/* <IconButton onClick={handleMarkAllAsRead}>
            <Iconify icon="solar:settings-bold-duotone" />
          </IconButton> */}
        </Stack>

        <Divider />

        { notificationList.length === 0 ? (
          <Stack alignItems="center" justifyContent="center" sx={{ p: 2, mt: 4 }}>
            <Typography variant='body1'>No notifications</Typography>
          </Stack>
        ) : renderList}
      </Drawer>
      <ConfirmDialog
        open={showDetail.value}
        onClose={showDetail.onFalse}
        hasCancel={false}
        maxWidth="sm"
        title={notificationDetail?.title}
        content={(<Markdown children={notificationDetail?.body || ''} />)}
        action={
          <Button variant="contained" color="primary" onClick={handleCloseDetail}>
            Close
          </Button>
        }
      />
    </>
  );
}
