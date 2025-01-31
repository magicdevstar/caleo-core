import { useMemo } from 'react';
import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { capitalize } from 'lodash';
import { useMutation } from '@apollo/client';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router';
// @mui
import Grid from '@mui/material/Unstable_Grid2';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import CardHeader from '@mui/material/CardHeader';
import Button from '@mui/material/Button';
import LoadingButton from '@mui/lab/LoadingButton';
// __generated__
import { DayOfWeek, Organization, OrganizationFeatureOptions, OrganizationFeatures } from 'src/__generated__/resolvers-types';
// hooks
import { useResponsive } from 'src/hooks/use-responsive';
// utils
import { states } from 'src/utils/states';
// api
import { CREATE_ORGANIZATION, UPDATE_ORGANIZATION } from 'src/api/organization';
// routes
import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
// components
import FormProvider from 'src/components/hook-form/form-provider';
import { RHFSelect, RHFSwitch, RHFTextField } from 'src/components/hook-form';
import { CircularProgress } from '@mui/material';
import InviteUserModal from 'src/components/invite-user/invite-user-modal';
import { useBoolean } from 'src/hooks/use-boolean';

type Props = {
  currentOrganization?: Organization;
  features: OrganizationFeatureOptions[];
  loadingFeatures: boolean;
};

export default function OrganizationForm({
  currentOrganization,
  features,
  loadingFeatures,
}: Props) {
  const mdUp = useResponsive('up', 'md');
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const inviteModal = useBoolean();

  const [createOrg] = useMutation(CREATE_ORGANIZATION);

  const [updateOrg] = useMutation(UPDATE_ORGANIZATION);

  const OrganizationSchema = useMemo(() =>
    Yup.object().shape({
      id: Yup.string().optional(),
      name: Yup.string().required('Name is required'),
      address: Yup.string(),
      state: Yup.string(),
      city: Yup.string(),
      weekBegins: Yup.string(),
      timezone: Yup.string(),
      zip: Yup.string(),
      features: Yup.object().shape(features.reduce((obj, { value }) => ({
        ...obj,
        [value]: Yup.boolean()
      }), {})),
      sso: Yup.object().shape({
        uiSubDomains: Yup.string(),
        enablePasswordLogin: Yup.boolean(),
        metadataDocUrl: Yup.string(),
      }).optional(),
    }),
  [features]);

  const defaultValues = useMemo(
    () => ({
      id: currentOrganization?.id,
      name: currentOrganization?.name || '',
      address: currentOrganization?.address || '',
      state: currentOrganization?.state || '',
      city: currentOrganization?.city || '',
      zip: currentOrganization?.zip || '',
      weekBegins: currentOrganization?.weekBegins || 'SUNDAY',
      timezone: currentOrganization?.timezone || 'America/Los_Angeles',
      features: currentOrganization?.flatFeatures ? JSON.parse(currentOrganization?.flatFeatures) as {} : {},
      sso: (currentOrganization?.sso ? {
        uiSubDomains: (currentOrganization?.sso.uiSubDomains || []).join(','),
        enablePasswordLogin: currentOrganization?.sso.enablePasswordLogin || false,
        metadataDocUrl: currentOrganization?.sso.metadataDocUrl || '',
      } : undefined),
    }),
    [currentOrganization]
  );

  const methods = useForm({
    resolver: yupResolver(OrganizationSchema),
    mode: 'onChange',
    values: defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting, isDirty },
    getValues,
  } = methods;

  const onSubmit = handleSubmit(async (values) => {
    if (currentOrganization) {
      try {
        await updateOrg({
          variables: {
            organization: {
              ...values,
              sso: (values.sso ? {
                ...values.sso,
                uiSubDomains: values.sso.uiSubDomains ? values.sso.uiSubDomains.split(',').map((domain) => domain.trim()) : [],
              } : {})
            },
          },
        });
        enqueueSnackbar('Organization updated successfully!');
      } catch (error) {
        enqueueSnackbar('Failed to update organization. Please try again.', { variant: 'error' });
        console.error(error);
      }
    } else {
      try {
        const createOrgResponse = await createOrg({
          variables: {
            organization: values,
          },
        });
        enqueueSnackbar('Organization created successfully!');
        navigate(
          paths.admin.organizations.details(createOrgResponse?.data?.createOrganization?.id)
        );
      } catch (error) {
        enqueueSnackbar('Failed to create organization. Please try again.', { variant: 'error' });
        console.error(error);
      }
    }
  });

  const renderDetails = (
    <>
      {mdUp && (
        <Grid md={4}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            Details
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Name and location details
          </Typography>
        </Grid>
      )}

      <Grid xs={12} md={8}>
        <Card>
          {!mdUp && <CardHeader title="Details" />}

          <Stack spacing={3} sx={{ p: 3 }}>
            <RHFTextField name="name" label="Name *" disabled={isSubmitting} />

            <RHFTextField name="address" label="Address" disabled={isSubmitting} />

            <Stack spacing={3} direction={{ xs: 'column', md: 'row' }}>
              <RHFTextField name="city" label="City" disabled={isSubmitting} />

              <RHFSelect name="state" label="State" disabled={isSubmitting}>
                {states.map(({ abbreviation: option }) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </RHFSelect>

              <RHFTextField name="zip" label="Zip Code" disabled={isSubmitting} />
            </Stack>

            <Stack spacing={3} direction={{ xs: 'column', md: 'row' }}>
              <RHFSelect name="timezone" label="Timezone" disabled={isSubmitting}>
                {[
                  'America/New_York',
                  'America/Chicago',
                  'America/Denver',
                  'America/Los_Angeles',
                ].map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </RHFSelect>

              <RHFSelect name="weekBegins" label="Week Start" disabled={isSubmitting}>
                {[
                  DayOfWeek.Monday,
                  DayOfWeek.Tuesday,
                  DayOfWeek.Wednesday,
                  DayOfWeek.Thursday,
                  DayOfWeek.Friday,
                  DayOfWeek.Saturday,
                  DayOfWeek.Sunday,
                ].map((option) => (
                  <MenuItem key={option} value={option}>
                    {capitalize(option)}
                  </MenuItem>
                ))}
              </RHFSelect>
            </Stack>
            <Tooltip title={currentOrganization ? '' : 'The organization must be created before inviting a user'}>
              <Box width="100%">
                <Button sx={{ width: '100%' }} disabled={!currentOrganization} onClick={() => inviteModal.onTrue()} variant='contained' color="primary">Invite User</Button>
              </Box>
            </Tooltip>
          </Stack>
        </Card>
      </Grid>
    </>
  );

  const renderFeatures = (
    <>
      {mdUp && (
        <Grid md={4}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            Features
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Feature flags
          </Typography>
        </Grid>
      )}

      <Grid xs={12} md={8}>
        <Card>
          {!mdUp && <CardHeader title="Features" />}

          <Stack spacing={3} sx={{ p: 3 }}>
            <Grid container spacing={2} sx={{ '.MuiGrid2-root': { xl: { flexGrow: '1' } } }}>
              {
                loadingFeatures ? (
                    <Grid xs={12}>
                      <Box display='flex' alignItems='center' justifyContent='center'>
                        <CircularProgress />
                      </Box>
                    </Grid>
                  ) :
                  features.map(({ value, label }) => {
                    const key = `features.${value}`;
                    return (
                      <Grid xs={12} md={6} lg={4} xl={2} key={value}>
                        <RHFSwitch name={key} label={label} disabled={isSubmitting} />
                      </Grid>
                    );
                  })
              }
            </Grid>
          </Stack>
        </Card>
      </Grid>
    </>
  );

  const renderSSOSettings = (
    <>
      {mdUp && (
        <Grid md={4}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            SSO Configuration
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Basic details we need to support their SSO configuration
          </Typography>
        </Grid>
      )}

      <Grid xs={12} md={8}>
        <Card>
          {!mdUp && <CardHeader title="Features" />}

          <Stack spacing={3} sx={{ p: 3 }}>
            <RHFTextField name="sso.uiSubDomains" label="UI Subdomains (Separated by comma)" disabled={isSubmitting} />
            <RHFTextField name="sso.metadataDocUrl" label="Metadata URL" disabled={isSubmitting} />
            <RHFSwitch name="sso.enablePasswordLogin" label="Enabled username/password login (Support coming soon)" disabled />
          </Stack>
        </Card>
      </Grid>
    </>
  );

  const renderActions = (
    <>
      {mdUp && <Grid md={4} />}
      <Grid
        xs={12}
        md={8}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}
      >
        <Button
          component={RouterLink}
          disabled={isSubmitting}
          variant="outlined"
          size="large"
          href={paths.admin.organizations.root}
        >
          Cancel
        </Button>
        <LoadingButton
          type="submit"
          loading={isSubmitting}
          disabled={!isDirty}
          variant="contained"
          size="large"
          sx={{ ml: 2 }}
        >
          {!currentOrganization ? 'Create Organization' : 'Save Changes'}
        </LoadingButton>
      </Grid>
    </>
  );

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        {renderDetails}

        {renderFeatures}

        {renderSSOSettings}

        {renderActions}
      </Grid>
      <InviteUserModal
        orgId={currentOrganization?.id || ''}
        inviteUser={inviteModal}
        disabledTiers={(getValues().features as OrganizationFeatures).disabledTiers}
        profileTenor={(getValues().features as OrganizationFeatures).profileTenor}
      />
    </FormProvider>
  );
}
