import { memo, useState, useCallback } from 'react';
import { useQuery } from '@apollo/client';
// @mui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
// components
import QueryView from 'src/components/query-view';
import { GET_USER_ACTIVITY } from 'src/api/user';
// utils
import { convertDate, useDateFormats } from 'src/hooks/use-datejs';
// hooks
import { useAuthContext } from 'src/auth/hooks';
// types
import { EventUserAction } from 'src/__generated__/resolvers-types';

import UserActivityItem from './user-activity-item';

// ----------------------------------------------------------------------

interface UserActivityProps {
  userId?: string;
}

function UserActivity({ userId }: UserActivityProps) {
  const { user } = useAuthContext();
  const { dateTimeFormat } = useDateFormats();
  const targetUserId = userId || user?.id;
  const [allActivities, setAllActivities] = useState<EventUserAction[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);

  const { data, loading, error, refetch, fetchMore } = useQuery(GET_USER_ACTIVITY, {
    variables: {
      input: {
        userId: targetUserId,
        limit: 10,
        orderBy: 'updatedAt',
        order: 'desc',
      },
    },
    skip: !targetUserId,
    onCompleted: (d) => {
      if (d?.eventUserActions?.items) {
        setAllActivities(d.eventUserActions.items);
      }
    },
  });

  const handleLoadMore = useCallback(async () => {
    if (allActivities.length === 0) return;
    
    setLoadingMore(true);
    try {
      const lastActivity = allActivities[allActivities.length - 1];
      const result = await fetchMore({
        variables: {
          input: {
            userId: targetUserId,
            limit: 10,
            orderBy: 'updatedAt',
            order: 'desc',
            cursor: lastActivity.id,
          },
        },
      });

      if (result.data?.eventUserActions?.items) {
        setAllActivities(prev => [...prev, ...result.data.eventUserActions.items]);
      }
    } catch (e) {
      console.error('Error loading more activities:', e);
    } finally {
      setLoadingMore(false);
    }
  }, [allActivities, targetUserId, fetchMore]);

  const activities = allActivities;

  return (
    <QueryView loading={loading} error={!!error} refetch={refetch}>
      <Box sx={{ width: '100%' }}>
        {activities.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No activity found
          </Typography>
        ) : (
          <>
            <Timeline position="right">
              {activities.map((activity: EventUserAction, index: number) => (
                <TimelineItem key={activity.id}>
                  <TimelineOppositeContent
                    sx={{
                      m: 'auto 0',
                      maxWidth: 120,
                    }}
                    align="right"
                    variant="body2"
                    color="text.secondary"
                  >
                    {convertDate({ date: new Date(activity.updatedAt), user }).format(dateTimeFormat)}
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot color="primary" />
                    {index < activities.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent sx={{ py: '12px', px: 2 }}>
                    <UserActivityItem activity={activity} />
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <LoadingButton
                variant="outlined"
                loading={loadingMore}
                onClick={handleLoadMore}
                disabled={activities.length < 10}
              >
                Load More
              </LoadingButton>
            </Box>
          </>
        )}
      </Box>
    </QueryView>
  );
}

export default memo(UserActivity);
