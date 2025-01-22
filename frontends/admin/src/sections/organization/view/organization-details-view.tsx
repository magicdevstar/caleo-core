import { useQuery } from '@apollo/client';
// @mui
import Container from '@mui/material/Container/Container';
import { ORGANIZATION_BY_ID, ORGANIZATION_FEATURES } from 'src/api/organization';
// routes
import { paths } from 'src/routes/paths';
// components
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { useSettingsContext } from 'src/components/settings';
import { useParams } from 'src/routes/hooks';
import QueryView from 'src/components/query-view';
import OrganizationForm from '../organization-form';

export default function OrganizationDetailsView() {
  const settings = useSettingsContext();
  const params = useParams();
  const shouldSkip = !params.orgId || params.orgId === 'new';

  const { data: orgFeatures, loading: loadingFeatures } = useQuery(ORGANIZATION_FEATURES);

  const { data, refetch, loading, error } = useQuery(ORGANIZATION_BY_ID, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      orgId: params.orgId,
    },
    skip: shouldSkip,
  });

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading={data?.organization || loading ? 'Organization Details' : 'New Organization'}
        links={[
          { name: 'Organizations', href: paths.admin.organizations.root },
          { name: data?.organization?.name || 'New Organization' },
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />
      <QueryView
        loading={loading}
        error={!!error}
        errorTitle="Failed to Load Organization"
        errorDescription="There was an error loading Organization details. Please try again."
        refetch={refetch}
      >
        <OrganizationForm currentOrganization={data?.organizationById} features={orgFeatures?.organizationFeatures || []} loadingFeatures={loadingFeatures} />
      </QueryView>
    </Container>
  );
}
