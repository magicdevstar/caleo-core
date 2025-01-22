// @apollo/client
import { useQuery } from '@apollo/client';
// @mui
import Container from '@mui/material/Container';
// hooks
import { useParams } from 'src/routes/hooks';
// types
import { paths } from 'src/routes/paths';
// components
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { GET_VENUE } from 'src/api/venues';
import QueryView from 'src/components/query-view';
import EditVenue from '../venues/edit-venue';

// ----------------------------------------------------------------------

export default function VenueDetail() {
  const settings = useSettingsContext();
  const params = useParams();
  const shouldSkip = !params.id || params.id === 'new';

  const { data, refetch, loading, error } = useQuery(GET_VENUE, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      id: params.id,
    },
    skip: shouldSkip,
  });

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Venue Detail"
        hideLinks={loading}
        links={[
          { name: 'Venues', href: paths.dashboard.admin.overtime.venues },
          {
            name: data?.venue?.name || 'Venue Detail',
          },
        ]}
        sx={{ mb: 3 }}
      />
      <QueryView
        loading={loading}
        error={!!error}
        errorTitle='Failed to Load Venue'
        errorDescription='There was an error loading Venue details. Please try again.'
        refetch={refetch}
      >
        <EditVenue currentVenue={data?.venue} />
      </QueryView>
    </Container>
  );
}
