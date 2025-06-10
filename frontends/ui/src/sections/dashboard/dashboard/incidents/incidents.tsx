import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
// @mui
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import Card, { CardProps } from '@mui/material/Card';
// hooks
import Carousel, { CarouselArrows, CarouselDots, useCarousel } from 'src/components/carousel';
// types
// components
import { Event, EventStatus } from 'src/__generated__/resolvers-types';
import { useIncidentLinks } from 'src/hooks/use-incident-link';
import { GET_ALL_EVENTS } from 'src/api/event';
import { getNow } from 'src/hooks/use-datejs';
import { useAuthContext } from 'src/auth/hooks';
import RecentNotificationItem, { IIncident } from './incident-item';
import IncidentSkeleton from './incident-skeleton';

// ----------------------------------------------------------------------

interface Props extends CardProps {
  title?: string;
  subheader?: string;
}

export default function Incidents({ title, subheader, ...other }: Props) {
  const { getHref } = useIncidentLinks();
  const { user } = useAuthContext();
  const currentTime = useMemo(() => getNow({ organization: user?.member?.org! }).toISOString(), [user]);
  const { data, loading } = useQuery(
    GET_ALL_EVENTS,
    {
      fetchPolicy: 'network-only', // Used for first execution
      nextFetchPolicy: 'cache-first', // Used for subsequent executions
      notifyOnNetworkStatusChange: true,
      variables: {
        input: {
          status: [EventStatus.Incident],
          range: {
            startTime: {
              lte: currentTime,
            },
            endTime: {
              gte: currentTime,
            },
          },
        },
      },
    }
  );

  const activeIncidents: IIncident[] = useMemo(() => {
    const eventList = data?.events?.items || [];
    return eventList.map((event: Event) => ({
      id: event.id,
      title: event.name,
      body: 'Click to sign FEMA form',
      createdAt: event.createdAt as any,
      action: {
        path: getHref(event.id),
        buttonText: 'Sign Form',
      },
      avatarUrl: '/assets/icons/files/ic_file.svg',
    }));
  }, [data, getHref]);

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
    if (activeIncidents?.length) {
      return (
        <Carousel ref={carousel.carouselRef} {...carousel.carouselSettings}>
          {activeIncidents.map((item) => (
            <RecentNotificationItem key={item.id} incident={item} />
          ))}
        </Carousel>
      );
    }
    // NO active incidents
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
          No Active Incidents
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
  }, [activeIncidents, carousel]);

  return (
    <Card {...other}>
      <CardHeader
        title={title}
        subheader={subheader}
        action={<CarouselArrows onNext={carousel.onNext} onPrev={carousel.onPrev} />}
      />

      {loading ? (
        <IncidentSkeleton />
      ) : (
        renderNotifications
      )}
    </Card>
  );
}
