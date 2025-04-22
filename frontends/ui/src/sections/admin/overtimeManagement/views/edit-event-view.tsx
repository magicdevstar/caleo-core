import { useState } from 'react';
import { useSnackbar } from 'notistack';
// @apollo/client
import { useMutation, useQuery } from '@apollo/client';
// @mui
import Container from '@mui/material/Container';
import LoadingButton from '@mui/lab/LoadingButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
// hooks
import { useParams, useRouter } from 'src/routes/hooks';
// types
import { paths } from 'src/routes/paths';
// components
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { CLONE_EVENT_BY_ID, CREATE_TEMPLATE_FROM_EVENT_ID, GET_EVENT } from 'src/api/event';
import { useEventSummary } from 'src/hooks/use-event-summary';
import Iconify from 'src/components/iconify/iconify';
import QueryView from 'src/components/query-view';
import { useFeatures } from 'src/hooks/use-features';
import EditEvent from '../events/edit-event';

// ----------------------------------------------------------------------

export default function VenueDetail() {
  const { enqueueSnackbar } = useSnackbar();
  const { kiosk } = useFeatures();
  const settings = useSettingsContext();
  const params = useParams();
  const router = useRouter();
  const { generateEventDownload, loading: summaryLoading } = useEventSummary();
  const shouldSkip = !params.eventId || params.eventId === 'new';

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const menuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const menuClose = () => {
    setAnchorEl(null);
  };

  const [cloneEvent] = useMutation(CLONE_EVENT_BY_ID, {
    onError: () => {
      enqueueSnackbar('Failed to create event. Please try again.', { variant: 'error', autoHideDuration: 2000 });
    },
    onCompleted: (data) => {
      const eventId = data?.cloneEvent?.id;
      if (eventId) {
        router.push(paths.dashboard.admin.overtime.eventDetail.replace(':eventId', eventId));
      }
    },
  });
  const [templateFromEventId] = useMutation(CREATE_TEMPLATE_FROM_EVENT_ID, {
    onError: () => {
      enqueueSnackbar('Failed to create event template. Please try again.', { variant: 'error', autoHideDuration: 2000 });
    },
    onCompleted: (data) => {
      const eventId = data?.templateEvent?.id;
      if (eventId) {
        router.push(paths.dashboard.admin.overtime.templates.eventDetail.replace(':eventId', eventId));
      }
    },
  });

  const { data, refetch, loading, error } = useQuery(GET_EVENT, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      id: params.eventId,
    },
    skip: shouldSkip,
  });

  const hideActionButtons = shouldSkip || error || loading;

  let actionButtons = hideActionButtons ? (<span />) : (
    <LoadingButton
      loading={summaryLoading}
      size="small"
      variant='contained'
      startIcon={<Iconify icon="mdi:file-download" />}
      onClick={() => {
        if (data?.event) {
          generateEventDownload(data?.event?.id)
        }
      }}
    >Download summary</LoadingButton>
  );

  if (kiosk && !hideActionButtons) {
    actionButtons = (
      <>
        <IconButton
          id="basic-button"
          aria-controls={open ? 'basic-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={menuClick}
        >
          <Iconify icon="eva:more-vertical-fill" />
        </IconButton>
        <Menu
          id="basic-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={menuClose}
          MenuListProps={{
            'aria-labelledby': 'basic-button',
          }}
        >
          <MenuItem onClick={() => {
            cloneEvent({ variables: { id: params.eventId } })
            menuClose();
          }}>
            <ListItemIcon>
              <Iconify icon="solar:magic-stick-3-bold" />
            </ListItemIcon>
            <ListItemText>Clone Event</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => {
            templateFromEventId({ variables: { id: params.eventId } })
            menuClose();
          }}>
            <ListItemIcon>
              <Iconify icon="solar:copy-bold-duotone" />
            </ListItemIcon>
            <ListItemText>Convert to template</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => {
            if (data?.event) {
              generateEventDownload(data?.event?.id)
            }
            menuClose();
          }}>
            <ListItemIcon>
              <Iconify icon="mdi:file-download" />
            </ListItemIcon>
            <ListItemText>Download Summary</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => {
            router.push(
              paths.kiosk.dashboard.replace(':eventId', data?.event?.id)
            );
            menuClose();
          }}>
            <ListItemIcon>
              <Iconify icon="ic:baseline-dashboard" />
            </ListItemIcon>
            <ListItemText>Event Dashboard</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => {
            router.push(
              paths.kiosk.root.replace(':eventId', data?.event?.id)
            );
            menuClose();
          }}>
            <ListItemIcon>
              <Iconify icon="material-symbols:moved-location" />
            </ListItemIcon>
            <ListItemText>Check in kiosk</ListItemText>
          </MenuItem>
        </Menu>
      </>
    )

  }

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Event Detail"
        hideLinks={loading}
        links={[
          { name: 'Events', href: paths.dashboard.admin.overtime.events },
          {
            name: data?.event?.name || 'Event Detail',
          },
        ]}
        sx={{ mb: 3 }}
        action={actionButtons}
      />

      <QueryView
        loading={loading}
        error={!!error}
        errorTitle='Failed to Load Event'
        errorDescription='There was an error loading Event details. Please try again.'
        refetch={refetch}
      >
        <EditEvent currentEvent={data?.event} />
      </QueryView>
    </Container>
  );
}
