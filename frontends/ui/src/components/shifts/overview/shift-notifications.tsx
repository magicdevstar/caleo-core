import { useQuery } from "@apollo/client";
// @mui
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
// hooks
import { convertDate, useDateFormats } from "src/hooks/use-datejs";
import { useAuthContext } from "src/auth/hooks";
// types
import { Shift } from "src/__generated__/resolvers-types";
import { GET_EVENT_NOTIFICATIONS } from "src/api/eventNotifications";

interface Props {
  shift?: Shift;
}

interface EventNotificationData {
  eventNotifications: {
    items: {
      title: string;
      description: string;
      attachments: string[];
      createdAt: string;
    }[];
    total: number;
  }
}

export default function ShiftNotifications({ shift }: Props) {
  const { dateTimeFormat } = useDateFormats();
  const { user } = useAuthContext();
  const { data } = useQuery<EventNotificationData>(GET_EVENT_NOTIFICATIONS, {
    variables: {
      input: {
        limit: 100,
        skip: 0,
        orderBy: 'createdAt',
        order: 'desc',
        eventId: shift?.event?.id,
        assignmentId: shift?.assignmentId,
        shiftId: shift?.id,
      }
    },
    skip: !shift,
  })

  const notifications = data?.eventNotifications?.items || [];

  if (notifications.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No notifications posted
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {notifications.map((notification, index) => (
        <Box key={index}>
          <Box sx={{ p: 1 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h6" gutterBottom>
                  {notification.title}
                </Typography>
                
                <Typography variant="body2" color="text.secondary">
                  {notification.description}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {convertDate({date: notification.createdAt, user}).format(dateTimeFormat)}
              </Typography>
            </Box>
            
            {notification.attachments && notification.attachments.length > 0 && (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                {notification.attachments.map((attachment, attachmentIndex) => (
                  <Chip
                    key={attachmentIndex}
                    label={`Attachment ${attachmentIndex + 1}`}
                    variant="outlined"
                    size="small"
                    color="primary"
                    onClick={() => window.open(attachment, '_blank')}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Stack>
            )}
          </Box>
          
          {index < notifications.length - 1 && (
            <Divider sx={{ borderStyle: 'dashed' }} />
          )}
        </Box>
      ))}
    </Box>
  )
}
