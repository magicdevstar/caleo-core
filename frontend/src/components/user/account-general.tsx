import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation, useQuery } from '@apollo/client';
// @mui
import LoadingButton from '@mui/lab/LoadingButton';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
// components
import { FrontendUser, UPDATE_USER } from 'src/api/user';
import { GET_RANKS } from 'src/api/rank';
import { useSnackbar } from 'src/components/snackbar';
import FormProvider, {
  RHFAutocomplete,
  RHFSelect,
  RHFTextField,
} from 'src/components/hook-form';
import Image from 'src/components/image/image';
import { MemberStatus, MemberTier, Rank } from 'src/__generated__/resolvers-types';

// ----------------------------------------------------------------------

const tierNames = {
  [MemberTier.Tier_1]: 'Tier 1',
  [MemberTier.Tier_2]: 'Tier 2',
}

const statusNames = {
  [MemberStatus.Active]: 'Active',
  [MemberStatus.Inactive]: 'Inactive',
  [MemberStatus.Pending]: 'Pending',
  [MemberStatus.Removed]: 'Removed',
}

export default function AccountGeneral({
  user
}: {
  user: FrontendUser
}) {
  const { enqueueSnackbar } = useSnackbar();

  const [updateUser] = useMutation(UPDATE_USER);
  const { data } = useQuery(GET_RANKS, {
    variables: {
      input: {},
    },
  });
  const { ranks: { items: ranks } } = data || { ranks: { items: [] } };

  const UpdateUserSchema = Yup.object().shape({
    firstName: Yup.string().required('First name is required'),
    lastName: Yup.string().required('Last name is required'),
    rank: Yup.object().required('Rank is required'),
    pNumber: Yup.string().required('P# Number is required'),
    status: Yup.string().required('Status is required'),
    tier: Yup.string().required('Tier is required'),
    tierExpiration: Yup.number(),
    deactivatedDate: Yup.number(),
  });

  const defaultValues = {
    firstName: (user?.firstName as string) || '',
    lastName: (user?.lastName as string) || '',
    rank: (user?.member?.rank as Rank) || {},
    pNumber: (user?.member?.pNumber as string) || '',
    status: (user?.member?.status) || MemberStatus.Active,
    tier: (user?.member?.tier) || MemberTier.Tier_1,
    tierExpiration: 0,
    deactivatedDate: 0,
  } as any;

  const methods = useForm({
    resolver: yupResolver(UpdateUserSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (d) => {
    try {
      await updateUser({
        variables: {
          input: {
            id: user?.id,
            cognitoId: user?.cognitoId,
            firstName: d.firstName,
            lastName: d.lastName,
            member: {
              orgId: user?.member?.orgId,
              pNumber: d.pNumber,
              rankId: d.rank.id,
              tier: d.tier,
            }
          }
        }
      })
      enqueueSnackbar('Update success!');
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

              <RHFAutocomplete
                name="rank"
                label="Rank"
                options={ranks}
                getOptionLabel={(option: any) => (option as Rank).name}
                renderOption={(props, option) => {
                  const rank = ranks.find(
                    (r: Rank) => r.id === option.id,
                  );

                  if (!rank) {
                    return null;
                  }

                  return (
                    <li {...props} key={rank.id}>
                      {rank.name}
                    </li>
                  );
                }}
              />
              <RHFTextField name="pNumber" label="PNumber" />

              <RHFSelect
                fullWidth
                name="status"
                label="Status"
                disabled
                InputLabelProps={{ shrink: true }}
                PaperPropsSx={{ textTransform: 'capitalize' }}
              >
                {[
                  MemberStatus.Pending,
                  MemberStatus.Active,
                  MemberStatus.Inactive,
                  MemberStatus.Removed,
                ].map((option) => (
                  <MenuItem key={option} value={option}>
                    {(statusNames as any)[option]}
                  </MenuItem>
                ))}
              </RHFSelect>
              <RHFSelect
                fullWidth
                name="tier"
                label="Tier"
                disabled
                InputLabelProps={{ shrink: true }}
                PaperPropsSx={{ textTransform: 'capitalize' }}
              >
                {[
                  MemberTier.Tier_1,
                  MemberTier.Tier_2,
                ].map((option) => (
                  <MenuItem key={option} value={option}>
                    {tierNames[option]}
                  </MenuItem>
                ))}
              </RHFSelect>
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
