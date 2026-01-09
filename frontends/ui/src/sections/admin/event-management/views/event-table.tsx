// @mui
import Container from '@mui/material/Container';
// types
import { paths } from 'src/routes/paths';
// components
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import EventTable from '../common/event-table';

// ----------------------------------------------------------------------

export default function EventTableView({
  title = 'Finance Unit',
  pathLink = paths.dashboard.admin.eventManagement.financeUnitDetail,
}: {
  title?: string;
  pathLink?: string;
}) {
  const settings = useSettingsContext();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading={title}
        links={[
          { name: title },
        ]}
        sx={{
          mb: { xs: 3, md: 3 },
        }}
      />
      <EventTable pathLink={pathLink} />
    </Container>
  );
}
