import { memo, useMemo } from 'react';
// @mui
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
// types
import { EventUserAction, EventUserActionType } from 'src/__generated__/resolvers-types';
// hooks
import { convertDate, useDateFormats } from 'src/hooks/use-datejs';
import { useAuthContext } from 'src/auth/hooks';
// components
import { UserActivityList } from './user-activity-list';
import { useUserActivity } from './hooks/use-user-activity';

// ----------------------------------------------------------------------
interface UserActivityItemProps {
  activity: EventUserAction;
}

function UserActivityItem({ activity }: UserActivityItemProps) {
  const { dateTimeFormat, dateFormat } = useDateFormats();
  const { user } = useAuthContext();
  const { activity: aggregatedActivity } = useUserActivity(activity);

  const labels = useMemo(() => {
    let eventType = '';
    let subtitle = '';
    if (activity.actionType === EventUserActionType.Shift) {
      eventType = `: ${activity.shifts?.[0]?.assignment?.name || ''}`;
      if (activity.shifts?.[0]?.startTime && activity.shifts?.[0]?.endTime) {
        const start = convertDate({ date: activity.shifts?.[0]?.startTime, user }).format(dateTimeFormat);
        const end = convertDate({ date: activity.shifts?.[0]?.endTime, user }).format(dateTimeFormat);
        subtitle = `${start} - ${end}`;
      }
    } else if (activity.actionType === EventUserActionType.IncidentSubmission) {
      eventType = `: Incident Submission`;
      subtitle = convertDate({ date: activity.incidentForm!.operationalPeriod.date, user }).format(dateFormat);
    }


    return {
      eventType,
      subtitle,
    };
  }, [
    activity,
    dateFormat,
    dateTimeFormat,
    user
  ]);

  return (
    <Card sx={{ minWidth: 275, mb: 1 }}>
      <CardContent>
        <Typography variant="h6" component="div" gutterBottom>
          {activity.event.name}{labels.eventType}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {labels.subtitle}
        </Typography>

        <Divider>Activity</Divider>
        <UserActivityList items={aggregatedActivity} emptyMessage="No activity found" />
      </CardContent>
    </Card>
  );
}

export default memo(UserActivityItem);
