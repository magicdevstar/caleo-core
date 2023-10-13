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
import { LoadingScreen } from 'src/components/loading-screen';
import { GET_VENUE } from 'src/api/venues';
import EditVenue from '../venues/edit-venue';

// ----------------------------------------------------------------------

export default function VenueDetail() {
  const settings = useSettingsContext();
  const params = useParams();

  const { data, loading } = useQuery(GET_VENUE, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      id: params.id,
    }, 
  });

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Venue Detail"
        links={[
          { name: 'Venues', href: paths.dashboard.admin.overtime.venues },
          {
            name: 'Venue Detail',
          },
        ]}
        sx={{ mb: 1 }}
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
          <EditVenue currentVenue={data?.venue} />
        )
      }
    </Container>
  );
}
