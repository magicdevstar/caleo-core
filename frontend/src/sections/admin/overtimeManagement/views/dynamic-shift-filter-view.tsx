// @mui
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
// components
import { useSettingsContext } from 'src/components/settings';
import DynamicShiftFilter from '../dynamicShiftFilter/dynamicShiftFilter';

// ----------------------------------------------------------------------

export default function DynamicShiftFilterView() {
  const settings = useSettingsContext();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <Box
        sx={{
          mb: { xs: 3, md: 3 },
        }}
      >
        <Stack direction="row" alignItems="center">
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" gutterBottom>
              Dynamic Shift Filter
            </Typography>
          </Box>
        </Stack>
      </Box>
      <DynamicShiftFilter />
    </Container>
  );
}
