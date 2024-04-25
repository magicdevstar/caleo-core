import { useMemo, useEffect } from 'react';
import * as Yup from 'yup';
import { useMutation } from '@apollo/client';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
// @mui
import LoadingButton from '@mui/lab/LoadingButton';
import Card from '@mui/material/Card';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
// hooks
import { useResponsive } from 'src/hooks/use-responsive';
// routes
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
// types
import { Venue, VenueStatus } from 'src/__generated__/resolvers-types';
// components
import { useSnackbar } from 'src/components/snackbar';
import FormProvider, {
  RHFEditor,
  RHFTextField,
  RHFSwitch,
  RHFSelect,
  RHFDatePicker,
} from 'src/components/hook-form';
import { RouterLink } from 'src/routes/components';
import { GET_ALL_VENUES, GET_VENUE, UPSERT_VENUE } from 'src/api/venues';
import { states } from 'src/utils/states';
import RHFPhoneField from 'src/components/hook-form/rhf-phone-field';
import { useFeatures } from 'src/hooks/use-features';

// ----------------------------------------------------------------------

type Props = {
  currentVenue?: Venue;
};

export default function EditVenue({ currentVenue }: Props) {
  const { venueContractDates } = useFeatures();
  const router = useRouter();

  const [upsertVenue] = useMutation(UPSERT_VENUE, {
    refetchQueries: [GET_ALL_VENUES, GET_VENUE],
  });

  const mdUp = useResponsive('up', 'md');

  const { enqueueSnackbar } = useSnackbar();

  const NewVenueSchema = Yup.object().shape({
    id: Yup.string(),
    name: Yup.string().required('Name is required'),
    address: Yup.string(),
    city: Yup.string(),
    state: Yup.string(),
    zip: Yup.string(),
    phone: Yup.string(),
    notes: Yup.string(),
    contract: Yup.object().shape({
      expirationDate: Yup.date().optional(),
      name: Yup.string(),
      insuranceName: Yup.string().optional(),
    }).optional(),
    contact: Yup.object().shape({
      firstName: Yup.string(),
      lastName: Yup.string(),
      email: Yup.string(),
      phone: Yup.string(),
    }),
    status: Yup.boolean().required('Status is required'),
  });

  const defaultValues = useMemo(
    () => ({
      id: currentVenue?.id,
      name: currentVenue?.name || '',
      address: currentVenue?.address || '',
      city: currentVenue?.city || '',
      state: currentVenue?.state || '',
      zip: currentVenue?.zip || '',
      phone: currentVenue?.phone || '',
      notes: currentVenue?.notes || '',
      contract: currentVenue?.contract ? {
        expirationDate: currentVenue?.contract?.expirationDate ? new Date(currentVenue?.contract?.expirationDate) : undefined,
        name: currentVenue?.contract?.name || '',
        insuranceName: currentVenue?.contract?.insuranceName || '',
      } : undefined,
      contact: {
        firstName: currentVenue?.contact?.firstName || '',
        lastName: currentVenue?.contact?.lastName || '',
        email: currentVenue?.contact?.email || '',
        phone: currentVenue?.contact?.phone || '',
      },
      status: !(currentVenue?.status === VenueStatus.Inactive),
    }),
    [currentVenue]
  );

  const methods = useForm({
    resolver: yupResolver(NewVenueSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (currentVenue) {
      reset(defaultValues);
    }
  }, [currentVenue, defaultValues, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      await upsertVenue({
        variables: {
          input: {
            id: data.id,
            name: data.name,
            address: data.address,
            city: data.city,
            state: data.state,
            zip: data.zip,
            phone: data.phone,
            notes: data.notes,
            ...(data.contract && venueContractDates && {
              contract: data.contract,
            }),
            contact: {
              firstName: data.contact.firstName,
              lastName: data.contact.lastName,
              email: data.contact.email,
              phone: data.contact.phone,
            },
            status: data.status ? VenueStatus.Active : VenueStatus.Inactive,
          },
        },
      });
      reset();
      enqueueSnackbar(currentVenue ? 'Update success!' : 'Create success!');
      router.push(paths.dashboard.admin.overtime.venues);
    } catch (error) {
      enqueueSnackbar('Failed to save changes. Please try again.', { variant: 'error' });
      console.error(error);
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
            Name, address, notes, etc
          </Typography>
        </Grid>
      )}

      <Grid xs={12} md={8}>
        <Card>
          {!mdUp && <CardHeader title="Details" />}

          <Stack spacing={3} sx={{ p: 3 }}>
            <RHFTextField name="name" label="Name" />
            <RHFTextField name="address" label="Address" />
            <Stack direction="row" spacing={2}>
              <RHFTextField name="city" label="City" />
              <RHFSelect
                name="state"
                label="State"
              >
                {states.map(({ abbreviation: option }) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </RHFSelect>
            </Stack>
            <Stack direction="row" spacing={2}>
              <RHFTextField name="zip" label="Zip Code" />
              <RHFPhoneField name="phone" label="Phone" />
            </Stack>

            {
              venueContractDates && (
                <>
                  <Stack direction="row" spacing={2}>
                    <RHFTextField name="contract.name" label="Contract Name" />
                    <RHFDatePicker name="contract.expirationDate" label="Contract/Insurance Expiration" />
                  </Stack>
                  <RHFTextField name="contract.insuranceName" label="Insurance Name" />
                </>
              )}

            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Notes</Typography>
              <RHFEditor simple name="notes" />
            </Stack>

            <RHFSwitch name="status" label="Active" />
          </Stack>
        </Card>
      </Grid>
    </>
  );

  const renderContact = (
    <>
      {mdUp && (
        <Grid md={4}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            Contact
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Venue contact info
          </Typography>
        </Grid>
      )}

      <Grid xs={12} md={8}>
        <Card>
          {!mdUp && <CardHeader title="Contact" />}

          <Stack spacing={3} sx={{ p: 3 }}>
            <Stack direction="row" spacing={2}>
              <RHFTextField name="contact.firstName" label="First Name" />
              <RHFTextField name="contact.lastName" label="Last Name" />
            </Stack>
            <Stack direction="row" spacing={2}>
              <RHFTextField name="contact.email" label="Email" />
              <RHFPhoneField name="contact.phone" label="Phone" />
            </Stack>
          </Stack>
        </Card>
      </Grid>
    </>
  );

  const renderActions = (
    <>
      {mdUp && <Grid md={4} />}
      <Grid xs={12} md={8} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <Button
          component={RouterLink}
          variant='outlined'
          size="large"
          href={paths.dashboard.admin.overtime.venues}
        >Cancel</Button>
        <LoadingButton
          type="submit"
          variant="contained"
          size="large"
          loading={isSubmitting}
          sx={{ ml: 2 }}
        >
          {!currentVenue ? 'Create Venue' : 'Save Changes'}
        </LoadingButton>
      </Grid>
    </>
  );

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        {renderDetails}

        {renderContact}

        {renderActions}
      </Grid>
    </FormProvider>
  );
}
