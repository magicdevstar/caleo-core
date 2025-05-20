// @mui
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { styled } from '@mui/material/styles';
// utils
import { fToNow } from 'src/utils/format-time';
import { convertDate, useDateFormats } from 'src/hooks/use-datejs';
// hooks
import { useAuthContext } from 'src/auth/hooks';
import { useRouter } from 'src/routes/hooks';
// components
import Scrollbar from 'src/components/scrollbar';
import { reader } from 'src/layouts/_common/notifications-popover/notification-item';
import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export type RecentNotification = {
  id: string;
  title: string;
  body: string;
  avatarUrl: string;
  createdAt: string;
  action?: {
    path: string;
    buttonText: string;
  };
  onClick: VoidFunction;
};

type RecentNotificationItemProps = {
  notification: RecentNotification;
};

const StyledIconButton = styled(IconButton)({
  opacity: 0.70,
  '&:hover': { opacity: 1 },
});

export default function RecentNotificationItem({ notification }: RecentNotificationItemProps) {
  const { user } = useAuthContext();
  const { dateTimeFormat } = useDateFormats();
  const router = useRouter();
  const { avatarUrl, title, body, createdAt, action, onClick } = notification;

  const notificationAction = (
    <Stack
      spacing={1}
      direction="row"
      justifyContent="space-between"
      flexWrap="wrap"
      alignItems="center"
    >
      <Button
        onClick={() => {
          onClick?.();
          if (action?.path) {
            router.push(action?.path);
          }
        }}
        size="small"
        variant="contained"
      >
        {action?.buttonText}
      </Button>
      <Tooltip title="Mark as read">
        <StyledIconButton
          onClick={() => {
            onClick?.();
          }}
          color="inherit"
        >
          <Iconify icon="material-symbols:mark-as-unread" sx={{ width: 22, height: 22 }} />
        </StyledIconButton>
      </Tooltip>
    </Stack>
  );

  return (
    <Stack
      spacing={2}
      sx={{
        mt: 1,
        p: 3,
        position: 'relative',
        minHeight: 220,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={2}>
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
          <Box component="img" src={avatarUrl} sx={{ width: 24, height: 24 }} />
        </Stack>

        <ListItemText
          primary={reader(title)}
          secondary={
            <Tooltip title={convertDate({ date: createdAt, user }).format(dateTimeFormat)}>
              <span>{fToNow(createdAt)}</span>
            </Tooltip>
          }
          secondaryTypographyProps={{
            component: 'span',
            typography: 'caption',
            mt: 0.5,
            color: 'text.disabled',
          }}
        />
      </Stack>

      <Scrollbar sx={{ maxHeight: '4lh', px: 0.5 }}>
        <Typography component="div" variant="body2">
          {reader(body)}
        </Typography>
      </Scrollbar>

      {action && notificationAction}
    </Stack>
  );
}
