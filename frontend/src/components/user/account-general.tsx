import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import * as Yup from 'yup';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
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
import Skeleton from '@mui/material/Skeleton';
import { DateTimePicker } from '@mui/x-date-pickers';
import Divider from '@mui/material/Divider';
// components
import { CREATE_PROFILE_PHOTO_UPLOAD_URL, FrontendUser, GET_USER, ME, UPDATE_USER } from 'src/api/user';
import { GET_RANKS } from 'src/api/rank';
import { useSnackbar } from 'src/components/snackbar';
import FormProvider, {
  RHFAutocomplete,
  RHFSelect,
  RHFSwitch,
  RHFTextField,
  RHFUploadAvatar,
} from 'src/components/hook-form';
import Image from 'src/components/image';
// utils
import { fData } from 'src/utils/format-number';
import { MemberRole, MemberStatus, MemberTier, Rank } from 'src/__generated__/resolvers-types';
import RHFPhoneField from 'src/components/hook-form/rhf-phone-field';
import { client } from 'src/utils/apollo';
import { roleNames, tierNames } from 'src/utils/mapped.enums';
import { GET_LOTTERY_COUNTER } from 'src/api/event';
import { convertDate, dateFormat, dateTimeFormat } from 'src/hooks/use-datejs';

// ----------------------------------------------------------------------

dayjs.extend(utc);
dayjs.extend(timezone);

const statusNames = {
  [MemberStatus.Active]: 'Active',
  [MemberStatus.Inactive]: 'Inactive',
  [MemberStatus.Pending]: 'Pending',
  [MemberStatus.Removed]: 'Removed',
}

// eslint-disable-next-line prefer-arrow-callback
const DatePicker = memo(function PickMeComponent({
  tz,
  helperText,
  disabled,
  tierUntil,
  setTierUntil,
}: {
  tz: string;
  helperText?: string;
  disabled?: boolean;
  tierUntil: Date | null;
  setTierUntil: any;
}) {
  return (
    <DateTimePicker
      timezone={tz}
      ampm={false}
      disabled={disabled}
      timeSteps={{ hours: 1, minutes: 15, seconds: 5 }}
      label="Tier set until"
      defaultValue={tierUntil && dayjs.utc(tierUntil)}
      sx={{
        margin: 0,
        '& input': {
          padding: '17.5px 14px',
        },
      }}
      onChange={async (newValue: any) => {
        setTierUntil(newValue.toDate());
      }}
      slotProps={{
        textField: {
          fullWidth: true,
          margin: 'normal',
          helperText,
        },
      }}
    />
  )
})

export default function AccountGeneral({
  user,
  adminViewer
}: {
  user: FrontendUser;
  adminViewer: boolean;
}) {
  const { data: lotteryData } = useQuery(GET_LOTTERY_COUNTER)
  const { enqueueSnackbar } = useSnackbar();
  const [loadingImage, setLoadingImage] = useState(!!user?.image);

  const statusHelperText = useMemo(() => {
    const res = [];
    if (user && user?.member?.status === MemberStatus.Inactive) {
      if (user?.member?.inactivateUntil) {
        const inactivateUntil = dayjs.utc(new Date(user.member.inactivateUntil));
        res.push(`Inactive until: ${inactivateUntil.format(dateFormat)}`);
      }
      if (user?.member?.inactivationNote) {
        res.push(`Reason: ${user?.member?.inactivationNote}`);
      }
    }
    return res.join('\n');
  }, [user]);

  const [createUploadLink] = useMutation(CREATE_PROFILE_PHOTO_UPLOAD_URL);
  const [updateUser] = useMutation(UPDATE_USER);
  const { data } = useQuery(GET_RANKS, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: {},
    },
  });
  const { ranks: { items: ranks } } = data || { ranks: { items: [] } };

  const tierUntilHelpText = useMemo(() => {
    if (user?.member?.tier === MemberTier.Tier_1 || !user?.member?.tierResetOnNextLottery) {
      return '';
    }
    const lotteryEnd = convertDate({
      date: lotteryData?.lotteryCounter?.end || 0,
      user,
    });
    return `Tier will expire on ${lotteryEnd.format(dateTimeFormat)}`;
  }, [user, lotteryData]);

  const UpdateUserSchema = Yup.object().shape({
    firstName: Yup.string().required('First name is required'),
    lastName: Yup.string().required('Last name is required'),
    rank: Yup.object().required('Rank is required'),
    pNumber: Yup.string().required('P# Number is required'),
    status: Yup.string().required('Status is required'),
    tier: Yup.string().required('Tier is required'),
    tierUntil: Yup.date().nullable(),
    role: Yup.string().required('Role is required'),
    photoURL: Yup.mixed<any>().nullable(),
    tierExpiration: Yup.number(),
    deactivatedDate: Yup.number(),
    primaryPhone: Yup.string().required(),
    primaryPhoneReceive: Yup.boolean().required(),
    primaryEmail: Yup.string().required(),
    primaryEmailReceive: Yup.boolean().required(),
    secondaryPhone: Yup.string(),
    secondaryPhoneReceive: Yup.boolean(),
    secondaryEmail: Yup.string(),
    secondaryEmailReceive: Yup.boolean(),
    adminNote: Yup.string(),
  });

  const defaultValues = {
    firstName: (user?.firstName as string) || '',
    lastName: (user?.lastName as string) || '',
    rank: (user?.member?.rank as Rank) || {},
    pNumber: (user?.member?.pNumber as string) || '',
    status: (user?.member?.status) || MemberStatus.Active,
    tier: (user?.member?.tier) || MemberTier.Tier_1,
    tierUntil: user?.member?.tierUntil ? new Date(user?.member?.tierUntil) : null,
    role: (user?.member?.role) || MemberRole.Member,
    tierExpiration: 0,
    deactivatedDate: 0,
    primaryPhone: user?.member?.contactInfo?.primaryPhone.number,
    primaryPhoneReceive: user?.member?.contactInfo?.primaryPhone.receiveTexts,
    primaryEmail: user?.member?.contactInfo?.primaryEmail.address,
    primaryEmailReceive: user?.member?.contactInfo?.primaryEmail.receiveEmails,
    secondaryPhone: user?.member?.contactInfo?.secondaryPhone?.number,
    secondaryPhoneReceive: user?.member?.contactInfo?.secondaryPhone?.receiveTexts,
    secondaryEmail: user?.member?.contactInfo?.secondaryEmail?.address,
    secondaryEmailReceive: user?.member?.contactInfo?.secondaryEmail?.receiveEmails,
    adminNote: user?.member?.adminNote || '',
  } as any;

  const methods = useForm({
    resolver: yupResolver(UpdateUserSchema),
    defaultValues,
  });

  const {
    setValue,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = methods;

  const tierUntil = watch('tierUntil');

  useEffect(() => {
    if (user.image) {
      setLoadingImage(true);
      fetch(user.image)
        .then((res) => res.blob())
        .then((blob) => {
          const fileName = user.image || 'file';
          const file = new File([blob], fileName);
          const fileBlob = Object.assign(file, {
            preview: URL.createObjectURL(file),
            existing: true,
          });
          setValue('photoURL', fileBlob);
          setLoadingImage(false);
        }).catch((error) => {
          console.error(error);
        });
    }
  }, [user.image, setValue, setLoadingImage]);

  const handleDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];

      const newFile = Object.assign(file, {
        preview: URL.createObjectURL(file),
      });

      if (file) {
        setValue('photoURL', newFile, { shouldValidate: true });
      }
    },
    [setValue]
  );

  const onSubmit = handleSubmit(async (d) => {
    try {
      let imagePath;
      let uploadUrl;
      if (d.photoURL && !d.photoURL.existing) {
        const {
          data: {
            profilePhotoUploadUrl: {
              imagePath: imagePathFromServer,
              uploadUrl: uploadUrlFromServer,
            },
          }
        } = await createUploadLink();
        imagePath = imagePathFromServer;
        uploadUrl = uploadUrlFromServer;
      }

      await updateUser({
        variables: {
          input: {
            id: user?.id,
            cognitoId: user?.cognitoId,
            firstName: d.firstName,
            lastName: d.lastName,
            imagePath,
            member: {
              orgId: user?.member?.orgId,
              pNumber: d.pNumber,
              rankId: d.rank.id,
              role: d.role,
              tier: d.tier,
              tierUntil: d.tierUntil,
              adminNote: d.adminNote,
              status: d.status,
              contactInfo: {
                primaryEmail: {
                  address: d.primaryEmail,
                  receiveEmails: d.primaryEmailReceive,
                },
                primaryPhone: {
                  number: d.primaryPhone,
                  receiveTexts: d.primaryPhoneReceive,
                },
                ...(d.secondaryEmail && {
                  secondaryEmail: {
                    address: d.secondaryEmail,
                    receiveEmails: d.secondaryEmailReceive,
                  }
                }),
                ...(d.secondaryPhone && {
                  secondaryPhone: {
                    address: d.secondaryPhone,
                    receiveEmails: d.secondaryPhoneReceive,
                  }
                }),
              }
            }
          }
        },
      });

      if (document && uploadUrl) {
        // Upload file to S3
        await fetch(uploadUrl, {
          method: 'PUT',
          body: d.photoURL,
          headers: {
            'Content-Type': d.photoURL.type,
          },
        });
      }

      await client.refetchQueries({
        include: [
          GET_USER,
          ME,
        ]
      });

      // Reset photo url
      setValue('photoURL', undefined);
      enqueueSnackbar('Update success!');
    } catch (error) {
      console.error(error);
    }
  });

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid xs={12} md={4}>
          <Card sx={{ pt: 5, pb: 5, px: 3, textAlign: 'center' }}>
            {
              loadingImage ? (
                <Skeleton variant='circular'>
                  <Image
                    alt="avatar"
                    src={user?.photoURL}
                    sx={{
                      width: 1,
                      height: 1,
                      borderRadius: '50%',
                    }}
                  />
                </Skeleton>
              ) : (
                <RHFUploadAvatar
                  name="photoURL"
                  maxSize={3145728}
                  onDrop={handleDrop}
                  helperText={
                    <Typography
                      variant="caption"
                      sx={{
                        mt: 3,
                        mx: 'auto',
                        display: 'block',
                        textAlign: 'center',
                        color: 'text.disabled',
                      }}
                    >
                      Allowed *.jpeg, *.jpg, *.png, *.gif
                      <br /> max size of {fData(3145728)}
                    </Typography>
                  }
                />
              )
            }
            <Typography variant="h6"> { user?.displayName } </Typography>
            <Typography variant="caption"> { user?.email } </Typography>
          </Card>
        </Grid>

        <Grid xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            <Typography sx={{ mb: 2 }} variant='h6'>About</Typography>
            <Box
              rowGap={3}
              columnGap={2}
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
              }}
            >
              <RHFTextField disabled={!adminViewer} name="firstName" label="First Name" />
              <RHFTextField disabled={!adminViewer} name="lastName" label="Last Name" />

              <RHFAutocomplete
                name="rank"
                label="Rank"
                disabled={!adminViewer}
                options={ranks}
                getOptionLabel={(option: any) => (option as Rank).name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
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
              <RHFTextField disabled={!adminViewer} name="pNumber" label="PNumber" />

              <RHFSelect
                fullWidth
                name="role"
                label="Role"
                disabled={!adminViewer}
                InputLabelProps={{ shrink: true }}
                PaperPropsSx={{ textTransform: 'capitalize' }}
              >
                {[
                  MemberRole.Admin,
                  MemberRole.Member,
                ].map((option) => (
                  <MenuItem key={option} value={option}>
                    {roleNames[option]}
                  </MenuItem>
                ))}
              </RHFSelect>

              <RHFSelect
                fullWidth
                name="status"
                label="Status"
                helperText={statusHelperText}
                sx={{
                  '& .MuiFormHelperText-root': {
                    whiteSpace: 'pre-line',
                  },
                }}
                disabled={!adminViewer}
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
                disabled={!adminViewer}
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

              <DatePicker
                disabled={!adminViewer}
                tz={user?.member?.org?.timezone!}
                tierUntil={tierUntil}
                helperText={tierUntilHelpText}
                setTierUntil={(value: any) => setValue('tierUntil', value)}
              />
            </Box>
            <Divider sx={{ mt: 4, mb: 2 }} />
            <Typography sx={{ mt: 3, mb: 2 }} variant='h6'>Contact Info</Typography>
            <Box
              rowGap={3}
              columnGap={2}
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
              }}
            >
              <Box>
                <RHFPhoneField disabled={!adminViewer} name="primaryPhone" label="Primary Phone" />
                <RHFSwitch disabled={!adminViewer} name="primaryPhoneReceive" label="Receive text messages" />
              </Box>

              <Box>
                <RHFTextField disabled={!adminViewer} name="primaryEmail" label="Primary Email" />
                <RHFSwitch disabled={!adminViewer} name="primaryEmailReceive" label="Receive emails" />
              </Box>

              <Box>
                <RHFPhoneField name="secondaryPhone" label="Secondary Phone" />
                <RHFSwitch name="secondaryPhoneReceive" label="Receive text messages" />
              </Box>

              <Box>
                <RHFTextField name="secondaryEmail" label="Secondary Email" />
                <RHFSwitch name="secondaryEmailReceive" label="Receive emails" />
              </Box>
              
            </Box>
            {
              adminViewer && (
                <>
                  <Divider sx={{ mt: 4, mb: 2 }} />
                  <Typography sx={{ mt: 3, mb: 2 }} variant='h6'>Contact Info</Typography>
                  <RHFTextField
                    fullWidth
                    multiline
                    rows={4}
                    name="adminNote"
                    label="Admin Notes"
                  />
                </>
              )
            }
            

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
