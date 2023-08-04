import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
// @mui
import LoadingButton from '@mui/lab/LoadingButton';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
// hooks
import { useAuthContext } from 'src/auth/hooks';
// components
import { useSnackbar } from 'src/components/snackbar';
import FormProvider, {
  RHFTextField,
} from 'src/components/hook-form';
import Image from 'src/components/image/image';

// ----------------------------------------------------------------------

export default function AccountGeneral() {
  const { enqueueSnackbar } = useSnackbar();

  const { user } = useAuthContext();

  const UpdateUserSchema = Yup.object().shape({
    firstName: Yup.string().required('First name is required'),
    lastName: Yup.string().required('Last name is required'),
    rank: Yup.string().required('Rank is required'),
    pNumber: Yup.string().required('P# Number is required'),
    status: Yup.string().required('Status is required'),
    tier: Yup.string().required('Tier is required'),
    tierExpiration: Yup.number(),
    deactivatedDate: Yup.number(),
  });

  const defaultValues = {
    firstName: (user?.displayName as string) || '',
    lastName: (user?.displayName as string) || '',
    rank: 'Police Lieutenant',
    pNumber: 'P123456',
    status: 'Active',
    tier: 'Tier 1',
    tierExpiration: 0,
    deactivatedDate: 0,
  };

  const methods = useForm({
    resolver: yupResolver(UpdateUserSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      enqueueSnackbar('Update success!');
      console.info('DATA', data);
    } catch (error) {
      console.error(error);
    }
  });

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid xs={12} md={2}>
          <Card sx={{ pt: 5, pb: 5, px: 3, textAlign: 'center' }}>
            <Image
              alt="avatar"
              src={user?.photoURL}
              sx={{
                width: 1,
                height: 1,
                borderRadius: '50%',
              }}
            />
            <Typography variant="h6"> { user?.displayName } </Typography>
            <Typography variant="caption"> { user?.email } </Typography>
          </Card>
        </Grid>

        <Grid xs={12} md={10}>
          <Card sx={{ p: 3 }}>
            <Box
              rowGap={3}
              columnGap={2}
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
              }}
            >
              <RHFTextField name="firstName" label="First Name" />
              <RHFTextField name="lastName" label="Last Name" />
              <RHFTextField name="rank" label="Rank" />
              <RHFTextField name="pNumber" label="PNumber" />
              <RHFTextField name="status" label="Status" />
              <RHFTextField name="tier" label="Tier" />
            </Box>

            <Stack spacing={3} alignItems="flex-end" sx={{ mt: 3 }}>
              <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                Save Changes
              </LoadingButton>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </FormProvider>
  );
}
