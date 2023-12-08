import { useQuery } from '@apollo/client';
// @mui
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

// types
import { ORGANIZATION } from 'src/api/organization';
// components
import { useSettingsContext } from 'src/components/settings';
import { LoadingScreen } from 'src/components/loading-screen';
import Department from '../department/department';


// ----------------------------------------------------------------------

export default function DepartmentView() {
  const { data, loading } = useQuery(ORGANIZATION, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
  });
  const settings = useSettingsContext();
  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <Typography variant="h4" sx={{ mb: 2 }}> Department </Typography>

      {
        loading ? (
          <LoadingScreen
            sx={{
              borderRadius: 1.5,
              bgcolor: 'background.default',
            }}
          />
        ) : (<Department organization={data?.organization} />)
      }
    </Container>
  );
}
