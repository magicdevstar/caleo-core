import { useMemo } from 'react';
// @mui
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
// __generated__
import { Organization } from 'src/__generated__/resolvers-types';
// api
import { ORGANIZATIONS } from 'src/api/organization';
// components
import { useSettingsContext } from 'src/components/settings';
import GQLTable from 'src/components/table/gql/table';
import { TableConfig } from 'src/components/table/table-config';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import Iconify from 'src/components/iconify';

export default function OrganizationsView() {
  const settings = useSettingsContext();
  const config: TableConfig<Organization> = useMemo(
    () => ({
      search: {
        defaultTableConfig: {
          defaultRowsPerPage: 10,
        },
        query: ORGANIZATIONS,
        processResult: (data: any) => {
          const {
            organizations: { items, total },
          } = data || { organizations: { items: [], total: 0 } };
          return {
            total,
            items,
          };
        },
      },
      rowActions: [],
      filters: [
        {
          id: 'query',
          type: 'text',
          label: 'Search',
          defaultValue: '',
          value: '',
          sizing: {
            md: 6,
            lg: 6,
          },
        },
      ],
      columns: [
        {
          id: 'name',
          label: 'Name',
          columnType: 'string',
        },
        {
          id: 'city',
          label: 'Location',
          columnType: 'string',
          renderValue: (city: string, index: number, row: Organization) => `${city}, ${row.state}`,
        },
        {
          id: 'createdAt',
          label: 'Created',
          columnType: 'date',
        },
      ],
    }),
    []
  );

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Organizations"
        links={[{ name: 'Organizations' }]}
        sx={{
          mb: { xs: 3, md: 3 },
        }}
        action={
          <Button variant="contained" startIcon={<Iconify icon="mingcute:add-line" />}>
            Create Organization
          </Button>
        }
      />
      <GQLTable config={config} />
    </Container>
  );
}
