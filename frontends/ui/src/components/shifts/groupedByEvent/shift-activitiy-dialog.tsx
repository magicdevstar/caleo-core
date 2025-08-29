import startCase from 'lodash/startCase';
import toLower from 'lodash/toLower';
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Timeline from "@mui/lab/Timeline";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineDot from "@mui/lab/TimelineDot";
import TimelineOppositeContent from "@mui/lab/TimelineOppositeContent";
import CircularProgress from "@mui/material/CircularProgress";
import { UseBooleanReturnType } from "src/hooks/use-boolean";
import { EventUserAction, EventUserActionLogAction } from "src/__generated__/resolvers-types";
import { useLazyQuery } from "@apollo/client";
import { GET_USER_SHIFT_ACTIVITY } from "src/api/user";
import { convertDate, useDateFormats } from "src/hooks/use-datejs";
import { useAuthContext } from "src/auth/hooks";
import Label from 'src/components/label';

interface Props {
  opener: UseBooleanReturnType<any>;
  userId?: string | null;
  entityId?: string;
  entityKey?: string;
};

interface QueryResponse {
  eventUserActions: {
    total: number;
    items: EventUserAction[];
  }
};

const getLabelColor = (action: EventUserActionLogAction) => {
  switch (action) {
    case EventUserActionLogAction.Approved:
    case EventUserActionLogAction.Assigned:
      return 'info';
    case EventUserActionLogAction.Completed:
      return 'success';
    case EventUserActionLogAction.Rejected:
    case EventUserActionLogAction.Relinquished:
    case EventUserActionLogAction.Removed:
    case EventUserActionLogAction.Unassigned:
    case EventUserActionLogAction.Voided:
      case EventUserActionLogAction.Declined:
      return 'error';
    case EventUserActionLogAction.CheckIn:
    case EventUserActionLogAction.CheckOut:
      return 'warning';
    case EventUserActionLogAction.Submitted:
    default:
      return 'default';
  }
}

export function ShiftActivityDialog({ opener, userId, entityId, entityKey }: Props) {
  const { user } = useAuthContext();
  const { dateTimeFormat } = useDateFormats();
  const [fetchActivity, { data: activityData, loading }] = useLazyQuery<QueryResponse>(GET_USER_SHIFT_ACTIVITY);
  const handleDialogOpen = () => {
    if (opener.value) {
      fetchActivity({
        variables: {
          input: {
            [entityKey || '']: entityId,
            userId,
            orderBy: 'timestamp',
            order: 'desc',
          }
        },
      });
    }
  };

  let content = (
    <Timeline position="right">
      {(activityData?.eventUserActions?.items || []).map((activity: EventUserAction, index: number) => (
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
            {convertDate({ date: new Date(activity.timestamp), user }).format(dateTimeFormat)}
          </TimelineOppositeContent>
          <TimelineSeparator>
            <TimelineDot color="primary" />
            {index < (activityData?.eventUserActions?.items || []).length - 1 && <TimelineConnector />}
          </TimelineSeparator>
          <TimelineContent sx={{ py: '12px', px: 2 }}>
            <Typography variant="subtitle2" component="h6">
              {startCase(toLower(activity.source))}: <span><Label variant="soft" color={getLabelColor(activity.action)}>{startCase(toLower(activity.action))}</Label></span>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Completed by: {activity.modifiedBy?.name || 'Unknown'}
            </Typography>
            {
              activity.actionId && (
                <Typography variant="body2" color="text.secondary">
                  ID: {activity.actionId}
                </Typography>
              )
            }
            {activity.notes && (
              <Typography variant="body2" color="text.secondary">
                Notes: {activity.notes}
              </Typography>
            )}
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );

  if (loading) {
    content = (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!loading && !activityData?.eventUserActions?.items?.length) {
    content = (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
        No activity found
      </Typography>
    );
  }

  return (
    <Dialog 
      open={opener.value} 
      onClose={opener.onFalse}
      maxWidth="sm"
      fullWidth
      TransitionProps={{
        onEntered: handleDialogOpen,
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Activity
      </DialogTitle>
      <DialogContent sx={{ pb: 3 }}>
        {content}
      </DialogContent>
    </Dialog>
  )
}
