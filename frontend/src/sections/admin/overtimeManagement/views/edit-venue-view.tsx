// @apollo/client
import { useQuery } from '@apollo/client';
// @mui
import Container from '@mui/material/Container';
// hooks
import { useParams } from 'src/routes/hooks';
// types
import { GET_VENUE } from 'src/api/venues';
import { LoadingScreen } from 'src/components/loading-screen';
import { paths } from 'src/routes/paths';
// components
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import EditVenue from '../venues/edit-venue';

// ----------------------------------------------------------------------

export default function EditVenueView() {
  const settings = useSettingsContext();
  const params = useParams();
  
  const { data, loading } = useQuery(GET_VENUE, {
    skip: params.id === 'new',
    variables: {
      id: params.id,
    },
  });

  let content = (
    <LoadingScreen
      sx={{
        borderRadius: 1.5,
        bgcolor: 'background.default',
      }}
    />
  );
  if (!loading) {
    content = <EditVenue currentVenue={data?.venue} />;
  }

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
        sx={{ mb: { xs: 3, md: 3 } }}
      />
      {content}
    </Container>
  );
}
