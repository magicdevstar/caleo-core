import { useQuery } from '@apollo/client';
// @mui
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

// types
import { ORGANIZATION } from 'src/api/organization';
// components
import { useSettingsContext } from 'src/components/settings';
import { LoadingScreen } from 'src/components/loading-screen';
import Overtime from '../overtime/overtime';


// ----------------------------------------------------------------------

export default function OvertimeView() {
  const { data, loading } = useQuery(ORGANIZATION, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
  });
  const settings = useSettingsContext();
  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <Typography variant="h4" sx={{ mb: 2 }}> Overtime </Typography>

      {
        loading ? (
          <LoadingScreen
            sx={{
              borderRadius: 1.5,
              bgcolor: 'background.default',
            }}
          />
        ) : (<Overtime organization={data?.organization} />)
      }
    </Container>
  );
}
