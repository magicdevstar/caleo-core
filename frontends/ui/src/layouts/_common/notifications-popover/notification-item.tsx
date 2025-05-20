// @mui
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import Tooltip from '@mui/material/Tooltip';
// utils
import { fToNow } from 'src/utils/format-time';
// components
import { convertDate, useDateFormats } from 'src/hooks/use-datejs';
import { useRouter } from 'src/routes/hooks';
import { UseBooleanReturnType } from 'src/hooks/use-boolean';

// ----------------------------------------------------------------------

export interface NotificationRendered {
  id: string;
  title: string;
  body?: string;
  category?: string;
  createdAt: Date;
  isUnRead: boolean;
  drawer: UseBooleanReturnType<unknown>;
  notificationAction?: {
    path: string;
    buttonText: string;
  };
  type: string;
  avatarUrl: string | null;
  onClick: VoidFunction;
};

type NotificationItemProps = {
  notification: NotificationRendered;
};

export default function NotificationItem({ notification }: NotificationItemProps) {
  const router = useRouter();
  const { dateTimeFormat } = useDateFormats();
  const renderAvatar = (
    <ListItemAvatar>
      {notification.avatarUrl ? (
        <Avatar src={notification.avatarUrl} sx={{ bgcolor: 'background.neutral' }} />
      ) : (
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            bgcolor: 'background.neutral',
          }}
        >
          <Box
            component="img"
            src={`/assets/icons/notification/${
              (notification.type === 'order' && 'ic_order') ||
              (notification.type === 'chat' && 'ic_chat') ||
              (notification.type === 'mail' && 'ic_mail') ||
              (notification.type === 'delivery' && 'ic_delivery')
            }.svg`}
            sx={{ width: 24, height: 24 }}
          />
        </Stack>
      )}
    </ListItemAvatar>
  );

  const renderText = (
    <ListItemText
      disableTypography
      primary={reader(notification.title)}
      secondary={
        <Stack
          direction="row"
          alignItems="center"
          sx={{ typography: 'caption', color: 'text.disabled' }}
          divider={
            <Box
              sx={{
                width: 2,
                height: 2,
                bgcolor: 'currentColor',
                mx: 0.5,
                borderRadius: '50%',
              }}
            />
          }
        >
          <Tooltip title={convertDate({ date: notification.createdAt, user: {} as any }).format(dateTimeFormat)}>
            <span>{fToNow(notification.createdAt)}</span>
          </Tooltip>
          {notification.category}
        </Stack>
      }
    />
  );

  const renderUnReadBadge = notification.isUnRead && (
    <Box
      sx={{
        top: 26,
        width: 8,
        height: 8,
        right: 20,
        borderRadius: '50%',
        bgcolor: 'info.main',
        position: 'absolute',
      }}
    />
  );

  const projectAction = (
    <Stack alignItems="flex-start">
      <Box
        sx={{
          p: 1.5,
          my: 1.5,
          borderRadius: 1.5,
          color: 'text.secondary',
          bgcolor: 'background.neutral',
          fontSize: '0.9rem',
        }}
      >
        {reader(notification.body || '')}
      </Box>
    </Stack>
  );

  const notificationAction = (
    <Stack spacing={1} direction="row">
      <Button onClick={() => {
        notification?.onClick?.();
        if (notification.notificationAction?.path) {
          notification.drawer.onFalse();
          router.push(notification.notificationAction?.path);
        }
      }} size="small" variant="contained">
        {notification.notificationAction?.buttonText}
      </Button>
    </Stack>
  );

  return (
    <ListItemButton
      onClick={notification?.onClick}
      disableRipple
      sx={{
        p: 2.5,
        alignItems: 'flex-start',
        borderBottom: (theme) => `dashed 1px ${theme.palette.divider}`,
      }}
    >
      {renderUnReadBadge}

      {renderAvatar}

      <Stack sx={{ flexGrow: 1 }}>
        {renderText}
        {notification.body && notification.body.trim() !== '' && projectAction}
        {notification.notificationAction && notificationAction}
      </Stack>
    </ListItemButton>
  );
}

// ----------------------------------------------------------------------

export function reader(data: string) {
  return (
    <Box
      dangerouslySetInnerHTML={{ __html: data }}
      sx={{
        mb: 0.5,
        '& p': { typography: 'body2', m: 0 },
        '& a': { color: 'inherit', textDecoration: 'none' },
        '& strong': { typography: 'subtitle2' },
      }}
    />
  );
}
