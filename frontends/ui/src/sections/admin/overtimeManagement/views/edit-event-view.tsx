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
import { EventStatus } from 'src/__generated__/resolvers-types';
// components
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { CLONE_EVENT_BY_ID, CREATE_TEMPLATE_FROM_EVENT_ID, GENERATE_DS_INVOICE, GENERATE_INVOICE, GET_EVENT } from 'src/api/event';
import { useEventSummary } from 'src/hooks/use-event-summary';
import Iconify from 'src/components/iconify/iconify';
import QueryView from 'src/components/query-view';
import { useFeatures } from 'src/hooks/use-features';
import { useOvertimeSlips } from 'src/hooks/use-overtime-slips';
import EditEvent from '../events/edit-event';

// ----------------------------------------------------------------------

export default function VenueDetail() {
  const { enqueueSnackbar } = useSnackbar();
  const { kiosk, lasdEventFields, eventInvoice } = useFeatures();
  const settings = useSettingsContext();
  const params = useParams();
  const router = useRouter();
  const { generateEventDownload, loading: summaryLoading } = useEventSummary();
  const { generateOvertimeSlipsDownload } = useOvertimeSlips();
  const shouldSkip = !params.eventId || params.eventId === 'new';

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const menuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const menuClose = () => {
    setAnchorEl(null);
  };

  const [generateInvoice] = useMutation(GENERATE_INVOICE, {
    onError: () => {
      enqueueSnackbar('Failed to create invoice. Please try again.', { variant: 'error', autoHideDuration: 2000 });
    },
    onCompleted: (data) => {
      const html = data?.generateInvoice;
      // Create a Blob with the HTML content
      const blob = new Blob([html], { type: 'text/html' });
      // Create a URL for the Blob
      const url = URL.createObjectURL(blob);
      // Open the Blob URL in a new tab
      window.open(url, '_blank');
    },
  });

  const [generateDSInvoice] = useMutation(GENERATE_DS_INVOICE, {
    onError: () => {
      enqueueSnackbar('Failed to create invoice. Please try again.', { variant: 'error', autoHideDuration: 2000 });
    },
    onCompleted: (data) => {
      const signingUrl = data?.generateDSInvoice?.signingUrl;
      if (signingUrl) {
        window.open(signingUrl, '_blank');
      }
    },
  });

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

  if ((kiosk || eventInvoice) && !hideActionButtons) {
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
          {lasdEventFields && (
            <MenuItem onClick={() => {
              if (data?.event) {
                generateOvertimeSlipsDownload(data?.event?.id)
              }
              menuClose();
            }}>
              <ListItemIcon>
                <Iconify icon="mdi:file-download" />
              </ListItemIcon>
              <ListItemText>Download Overtime Slips</ListItemText>
            </MenuItem>
          )}
          {eventInvoice && (
            <>
              <MenuItem disabled={
                !data?.event ||
                [EventStatus.Draft, EventStatus.Removed, EventStatus.Requested].includes(data?.event?.status)
              } onClick={() => {
                if (data?.event) {
                  generateInvoice({
                    variables: {
                      eventId: data?.event?.id,
                    },
                  });
                }
                menuClose();
              }}>
                <ListItemIcon>
                  <Iconify icon="mdi:invoice-text-edit" />
                </ListItemIcon>
                <ListItemText>Invoice Preview</ListItemText>
              </MenuItem>
              <MenuItem disabled={
                !data?.event ||
                [EventStatus.Draft, EventStatus.Removed, EventStatus.Requested].includes(data?.event?.status)
              } onClick={() => {
                if (data?.event) {
                  generateDSInvoice({
                    variables: {
                      eventId: data?.event?.id,
                    },
                  });
                }
                menuClose();
              }}>
                <ListItemIcon>
                  <Iconify icon="mdi:invoice-text-send" />
                </ListItemIcon>
                <ListItemText>Generate Invoice</ListItemText>
              </MenuItem>
              <MenuItem disabled={
                !data?.event ||
                [EventStatus.Draft, EventStatus.Removed, EventStatus.Requested].includes(data?.event?.status) ||
                !data?.event?.docusignEvent?.documentUrl
              } onClick={() => {
                if (data?.event?.docusignEvent?.documentUrl) {
                  window.open(data?.event?.docusignEvent?.documentUrl, '_blank');
                }
                menuClose();
              }}>
                <ListItemIcon>
                  <Iconify icon="mdi:download" />
                </ListItemIcon>
                <ListItemText>Download Invoice</ListItemText>
              </MenuItem>
            </>
          )}
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
