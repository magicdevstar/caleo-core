// @apollo/client
import { useQuery } from '@apollo/client';
// @mui
import Container from '@mui/material/Container';
import LoadingButton from '@mui/lab/LoadingButton';
// hooks
import { useParams } from 'src/routes/hooks';
// types
import { paths } from 'src/routes/paths';
// components
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { LoadingScreen } from 'src/components/loading-screen';
import { GET_EVENT } from 'src/api/event';
import { useEventSummary } from 'src/hooks/use-event-summary';
import Iconify from 'src/components/iconify/iconify';
import EditEvent from '../events/edit-event';

// ----------------------------------------------------------------------

export default function VenueDetail() {
  const settings = useSettingsContext();
  const params = useParams();
  const { generateEventDownload, loading: summaryLoading } = useEventSummary();
  const shouldSkip = !params.eventId || params.eventId === 'new';

  const { data, loading } = useQuery(GET_EVENT, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      id: params.eventId,
    },
    skip: shouldSkip,
  });

  const summaryButton = shouldSkip ? (<span />) : (
    <LoadingButton
      loading={summaryLoading}
      disabled={loading}
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

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Event Detail"
        links={[
          { name: 'Events', href: paths.dashboard.admin.overtime.events },
          {
            name: 'Event Detail',
          },
        ]}
        sx={{ mb: 1 }}
        action={summaryButton}
      />

      {
        loading ? (
          <LoadingScreen
            sx={{
              borderRadius: 1.5,
              bgcolor: 'background.default',
            }}
          />
        ) : (
          <EditEvent currentEvent={data?.event} />
        )
      }
    </Container>
  );
}
