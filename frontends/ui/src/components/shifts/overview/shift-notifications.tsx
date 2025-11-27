import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
// @mui
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
// hooks
import { convertDate, useDateFormats } from "src/hooks/use-datejs";
import { useAuthContext } from "src/auth/hooks";
// components
import MultiFilePreview from "src/components/upload/preview-multi-file";
// types
import { Shift } from "src/__generated__/resolvers-types";
import { GET_EVENT_NOTIFICATIONS } from "src/api/eventNotifications";
import { isAfter } from "date-fns";

interface Props {
  shift?: Shift;
}

interface EventNotificationData {
  eventNotifications: {
    items: EventNotification[];
    total: number;
  }
}

interface EventNotification {
  title: string;
  description: string;
  attachments: string[];
  createdAt: string;
}

export default function ShiftNotifications({ shift }: Props) {
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

  // Filter out demob notifications if we have checked out :)
  const notifications = useMemo(() => {
    const items = data?.eventNotifications?.items || [];

    const checkOutTime = shift?.shiftCheckInOut?.checkOutTime;
    if (!checkOutTime) return items;

    return items.filter((item) => {
      const isDemobItem = /demobilized/i.test(item.title);
      return !isDemobItem || isAfter(new Date(checkOutTime), new Date(item.createdAt));
    });
  }, [shift, data]);

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
        <Notification key={index} notification={notification} isLastItem={index === notifications.length - 1} />
      ))}
    </Box>
  )
}

function Notification({ notification, isLastItem }: { notification: EventNotification, isLastItem: boolean }) {
  const { dateTimeFormat } = useDateFormats();
  const { user } = useAuthContext();

  const [attachments, setAttachments] = useState<File[]>([]);

  useEffect(() => {
    try {
      if (!notification.attachments || notification.attachments.length === 0) return;
      const loadImage = async (url: string, index: number) => {
        try {
          const res = await fetch(url);
          const blob = await res.blob();
          const fileName = url || 'file';
          const file = new File([blob], fileName);
          return Object.assign(file, {
            preview: URL.createObjectURL(file),
            existing: true,
            attachmentPath: notification.attachments[index],
          });
        } catch(error) {
          console.error('Error loading attachment:', error);
          return undefined;
        }
      };

      const loadAll = async () => {
        if (!notification.attachments || notification.attachments.length === 0) return;
        const allImages = await Promise.all(notification.attachments.map(loadImage));
        setAttachments(allImages.filter(Boolean) as File[]);
      }
      loadAll();
    } catch(error) {
      console.error('Error loading attachments:', error);
    } 
  }, [notification.attachments]);

  return (
    <Box>
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
        
        {attachments.length > 0 && (
          <MultiFilePreview files={attachments} thumbnail />
        )}
      </Box>
      
      {isLastItem && (
        <Divider sx={{ borderStyle: 'dashed' }} />
      )}
    </Box>
  )
}
