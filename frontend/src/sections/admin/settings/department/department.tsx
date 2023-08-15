import { useMemo } from 'react';
import { capitalize } from 'lodash';
import * as Yup from 'yup';
import { useMutation } from '@apollo/client';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
// @mui
import LoadingButton from '@mui/lab/LoadingButton';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
// hooks
import { useResponsive } from 'src/hooks/use-responsive';
// types
import { DayOfWeek, Organization } from 'src/__generated__/resolvers-types';
// components
import { useSnackbar } from 'src/components/snackbar';
import FormProvider, {
  RHFTextField,
  RHFSelect,
  FormFooter,
} from 'src/components/hook-form';
import { ORGANIZATION, UPDATE_ORGANIZATION } from 'src/api/organization';
import { states } from 'src/utils/states';

// ----------------------------------------------------------------------

type Props = {
  organization: Organization;
};

export default function Department({ organization }: Props) {
  const mdUp = useResponsive('up', 'md');

  const [updateOrganization] = useMutation(UPDATE_ORGANIZATION, {
    refetchQueries: [ORGANIZATION],
  });

  const { enqueueSnackbar } = useSnackbar();

  const OrganizationSchema = Yup.object().shape({
    id: Yup.string().required(),
    name: Yup.string().required('Name is required'),
    address: Yup.string().required('Address is required'),
    state: Yup.string().required('State is required'),
    city: Yup.string().required('City is required'),
    zip: Yup.string().required('Zip code is required'),
    weekBegins: Yup.string().required('Week begins is required'),
    timezone: Yup.string().required('Timezone is required'),
    contact: Yup.object().shape({
      phone: Yup.string().required('Phone is required'),
      email: Yup.string().required('Email is required'),
    }),
  });

  const defaultValues = useMemo(
    () => ({
      id: organization?.id,
      name: organization?.name || '',
      address: organization?.address || '',
      state: organization?.state || '',
      city: organization?.city || '',
      zip: organization?.zip || '',
      weekBegins: organization?.weekBegins || '',
      timezone: organization?.timezone || '',
      contact: organization?.contact || {
        phone: organization?.contact?.phone || '',
        email: organization?.contact?.email || '',
      },
    }),
    [organization]
  );

  const methods = useForm({
    resolver: yupResolver(OrganizationSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    try {
      await updateOrganization({
        variables: {
          organization: {
            id: formData.id,
            name: formData.name,
            address: formData.address,
            state: formData.state,
            city: formData.city,
            zip: formData.zip,
            weekBegins: formData.weekBegins,
            timezone: formData.timezone,
            contact: {
              phone: formData.contact.phone,
              email: formData.contact.email,
            },
          },
        },
      });
      enqueueSnackbar('Update success!');
    } catch (error) {
      console.error(error);
    }
  });

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        {mdUp && (
          <Grid md={4}>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              Info
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Name, timezone, and week start
            </Typography>
          </Grid>
        )}
        <Grid xs={12} md={8} sx={{ mb: 2 }}>
          <Card>
            {!mdUp && <CardHeader title="Info" />}
            <Stack spacing={3} sx={{ p: 3 }}>
              <RHFTextField
                type="text"
                name="name"
                label="Name"
                helperText="The name of your department"
              />

              <RHFTextField
                type="text"
                name="timezone"
                label="Timezone"
                helperText="The timezone your department is in"
              />

              <RHFSelect
                name="weekBegins"
                label="Week start"
                helperText="The day of the week your schedule starts on"
              >
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
          </Card>
        </Grid>

        {mdUp && (
          <Grid md={4}>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              Address
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Street, City, State, etc.
            </Typography>
          </Grid>
        )}
        <Grid xs={12} md={8} sx={{ mb: 2 }}>
          <Card>
            {!mdUp && <CardHeader title="Address" />}
            <Stack spacing={3} sx={{ p: 3 }}>
              <RHFTextField
                type="text"
                name="address"
                label="Address"
                helperText="The street address of your department"
              />

              <RHFTextField
                type="text"
                name="city"
                label="City"
                helperText="The city your department is in"
              />

              <RHFSelect
                name="state"
                label="State"
                helperText="The start your department is in"
              >
                {states.map(({ abbreviation: option }) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </RHFSelect>

              <RHFTextField
                type="text"
                name="zip"
                label="Zip code"
                helperText="The zip code for your department"
              />
            </Stack>
          </Card>
        </Grid>

        {mdUp && (
          <Grid md={4}>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              Contact
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Contact info for your department
            </Typography>
          </Grid>
        )}
        <Grid xs={12} md={8} sx={{ mb: 2 }}>
          <Card>
            {!mdUp && <CardHeader title="Info" />}
            <Stack spacing={3} sx={{ p: 3 }}>
              <RHFTextField
                type="text"
                name="contact.phone"
                label="Phone"
                helperText="The phone number for your department"
              />

              <RHFTextField
                type="email"
                name="contact.email"
                label="Email"
                helperText="The email contact for your department"
              />
            </Stack>
          </Card>
        </Grid>
      </Grid>
      <FormFooter sx={{ p: 5 }}>
        <LoadingButton
          type="submit"
          variant="contained"
          loading={isSubmitting}
          sx={{ ml: 2 }}
        >
          Save
        </LoadingButton>
      </FormFooter>
    </FormProvider>
  );
}
