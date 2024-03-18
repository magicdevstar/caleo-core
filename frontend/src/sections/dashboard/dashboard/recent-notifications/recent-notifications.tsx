import { useMemo } from 'react';
import { useMutation, useQuery } from '@apollo/client';
// @mui
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import Card, { CardProps } from '@mui/material/Card';
// utils
import { notificationRouterPath } from 'src/utils/notificationRouterPath';
// hooks
import Carousel, { CarouselArrows, CarouselDots, useCarousel } from 'src/components/carousel';
import { clearNotifications } from 'src/hooks/use-browser-notification';
// types
import { GET_IN_APP_NOTIFICATIONS, MARK_ALL_AS_SEEN } from 'src/api/notification';
// components
import RecentNotificationItem, { RecentNotification } from './recent-notification-item';
import RecentNotificationSkeleton from './recent-notification-skeleton';

// ----------------------------------------------------------------------

interface Props extends CardProps {
  title?: string;
  subheader?: string;
}

export default function RecentNotifications({ title, subheader, ...other }: Props) {
  const { data: notificationsData, networkStatus: notificationNetworkStatus } = useQuery(
    GET_IN_APP_NOTIFICATIONS,
    {
      fetchPolicy: 'network-only', // Used for first execution
      nextFetchPolicy: 'cache-first', // Used for subsequent executions
      pollInterval: 1000 * 20,
      notifyOnNetworkStatusChange: true,
      variables: {
        input: {
          limit: 5,
          read: false,
        },
      },
    }
  );

  const [markAsSeen, { loading: markingAsSeenLoading }] = useMutation(MARK_ALL_AS_SEEN, {
    refetchQueries: [GET_IN_APP_NOTIFICATIONS],
  });

  // Exclude polling notifications as loading in order to prevent loading skeleton to show on each poll
  const loadingNotifications = useMemo(() => notificationNetworkStatus <= 4, [notificationNetworkStatus]);

  const recentNotifications: RecentNotification[] = useMemo(() => {
    const notificationList = notificationsData?.inAppNotifications?.items || [];
    return notificationList.map((notification: any) => ({
      id: notification.id,
      title: notification.title,
      body: notification.body,
      createdAt: notification.createdAt as any,
      action: notificationRouterPath(notification.templateName, notification.meta!),
      avatarUrl: '/assets/icons/notification/ic_mail.svg',
      onClick: () => {
        markAsSeen({
          variables: {
            ids: [notification.id],
          },
        });
        clearNotifications();
      },
    }));
  }, [notificationsData, markAsSeen]);

  const carousel = useCarousel({
    adaptiveHeight: true,
    ...CarouselDots({
      sx: {
        top: 5,
        left: 25,
        position: 'absolute',
        color: 'primary.light',
      },
    }),
  });

  const renderNotifications = useMemo(() => {
    if (recentNotifications?.length) {
      return (
        <Carousel ref={carousel.carouselRef} {...carousel.carouselSettings}>
          {recentNotifications.map((item) => (
            <RecentNotificationItem key={item.id} notification={item} />
          ))}
        </Carousel>
      );
    }
    // empty notifications
    return (
      <Stack spacing={0.5} alignItems="center" justifyContent="center" sx={{ pt: 2.5, pb: 6 }}>
        <Box
          component="img"
          alt="empty content"
          src="/assets/icons/empty/ic_mail.svg"
          sx={{ width: 1, maxWidth: 100 }}
        />
        <Typography
          variant="subtitle1"
          component="span"
          sx={{ color: 'text.secondary', textAlign: 'center' }}
        >
          No New Notifications
        </Typography>
        <Typography
          variant="body2"
          component="span"
          sx={{ color: 'text.secondary', textAlign: 'center' }}
        >
          {`You're all caught up!`}
        </Typography>
      </Stack>
    );
  }, [recentNotifications, carousel]);

  return (
    <Card {...other}>
      <CardHeader
        title={title}
        subheader={subheader}
        action={<CarouselArrows onNext={carousel.onNext} onPrev={carousel.onPrev} />}
      />

      {loadingNotifications || markingAsSeenLoading ? (
        <RecentNotificationSkeleton />
      ) : (
        renderNotifications
      )}
    </Card>
  );
}
