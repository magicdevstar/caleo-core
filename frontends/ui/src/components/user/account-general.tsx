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
import TextField from '@mui/material/TextField';
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
import { useSnackbar } from 'src/components/snackbar';
import FormProvider, {
  RHFDatePicker,
  RHFSelect,
  RHFSwitch,
  RHFTextField,
  RHFUploadAvatar,
} from 'src/components/hook-form';
import Image from 'src/components/image';
// utils
import { fData } from 'src/utils/format-number';
import { Division, MemberRole, MemberStatus, MemberTier, Rank, Unit } from 'src/__generated__/resolvers-types';
import RHFPhoneField from 'src/components/hook-form/rhf-phone-field';
import { client } from 'src/utils/apollo';
import { roleNames } from 'src/utils/mapped.enums';
import { GET_LOTTERY_COUNTER } from 'src/api/event';
import { convertDate, useDateFormats } from 'src/hooks/use-datejs';
import { useFeatures } from 'src/hooks/use-features';
import { useTiers } from 'src/hooks/use-tiers';
import { usePNumberLabel } from 'src/hooks/use-pNumber-label';
import { useAuthContext } from 'src/auth/hooks';
import RHFRankSelect from '../ranks/rhf-rank-select';
import RHFUnitSelect from '../unit/rhf-unit-select';

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
  error,
  onChange = () => {},
}: {
  tz: string;
  helperText?: string;
  disabled?: boolean;
  tierUntil: Date | null;
  setTierUntil: any;
  error?: boolean;
  onChange?: (hasValue: boolean) => void;
}) {
  return (
    <DateTimePicker
      timezone={tz}
      ampm={false}
      disabled={disabled}
      timeSteps={{ hours: 1, minutes: 15, seconds: 5 }}
      label="Tier set until"
      defaultValue={tierUntil && dayjs.utc(tierUntil)}
      disablePast
      sx={{
        margin: 0,
        '& input': {
          padding: '17.5px 14px',
        },
      }}
      onChange={async (newValue: any) => {
        if (!newValue) {
          setTierUntil(newValue);
          onChange(false);
        } else {
          setTierUntil(newValue.toDate());
          onChange(true);
        }
      }}
      slotProps={{
        field: { clearable: true },
        textField: {
          fullWidth: true,
          margin: 'normal',
          helperText,
          error,
        },
      }}
    />
  )
})

export default function AccountGeneral({
  user,
  adminViewer,
  allDisabled,
}: {
  user: FrontendUser;
  adminViewer: boolean;
  allDisabled?: boolean;
}) {
  const { user: currentUser, reInitialize } = useAuthContext();
  const { dateTimeFormat, dateFormat } = useDateFormats();
  const { disabledTiers, disabledTierUntil, lasdUserFields, rankHourlyRate, officerCheckInOut } = useFeatures();
  const { tierNames, enabledTiers } = useTiers();
  const { pNumberLabel } = usePNumberLabel();
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
  }, [user, dateFormat]);

  const [createUploadLink] = useMutation(CREATE_PROFILE_PHOTO_UPLOAD_URL);
  const [updateUser] = useMutation(UPDATE_USER);

  const tierUntilHelpText = useMemo(() => {
    if (user?.member?.tier === MemberTier.Tier_1 || !user?.member?.tierResetOnNextLottery) {
      return '';
    }
    const lotteryEnd = convertDate({
      date: lotteryData?.lotteryCounter?.end || 0,
      user,
    });
    return `Tier will expire on ${lotteryEnd.format(dateTimeFormat)}`;
  }, [user, dateTimeFormat, lotteryData]);

  const UpdateUserSchema = Yup.object().shape({
    firstName: Yup.string().required('First name is required'),
    lastName: Yup.string().required('Last name is required'),
    rank: Yup.object().required('Rank is required'),
    pNumber: Yup.string().required(`${pNumberLabel} is required`),
    status: Yup.string().required('Status is required'),
    tier: Yup.string().required('Tier is required'),
    tierUntil: Yup.date().nullable(),
    tenor: lasdUserFields ? Yup.date().nullable().required('Tenor is required') : Yup.date().nullable(),
    unit: lasdUserFields ? Yup.object().nullable().required('Unit is required') : Yup.object().nullable(),
    division: lasdUserFields ? Yup.object().nullable().required('Division is required') : Yup.object().nullable(),
    role: Yup.string().required('Role is required'),
    photoURL: Yup.mixed<any>().nullable(),
    tierExpiration: Yup.number(),
    deactivatedDate: Yup.number(),
    primaryPhone: Yup.string(),
    primaryPhoneReceive: Yup.boolean().required(),
    primaryEmail: Yup.string().required(),
    primaryEmailReceive: Yup.boolean().required(),
    secondaryPhone: Yup.string(),
    secondaryPhoneReceive: Yup.boolean(),
    secondaryEmail: Yup.string(),
    secondaryEmailReceive: Yup.boolean(),
    adminNote: Yup.string(),
    hourlyRate: Yup.number().nullable(),
    incidentHourlyRate: Yup.number().nullable(),
    allowSelfCheckIn: Yup.boolean(),
  });

  const defaultValues = {
    firstName: (user?.firstName as string) || '',
    lastName: (user?.lastName as string) || '',
    rank: (user?.member?.rank as Rank) || undefined,
    division: (user?.member?.division as Division),
    unit: (user?.member?.unit as Unit),
    pNumber: (user?.member?.pNumber as string) || '',
    status: (user?.member?.status) || MemberStatus.Active,
    tier: (user?.member?.tier) || MemberTier.Tier_1,
    tierUntil: user?.member?.tierUntil ? new Date(user?.member?.tierUntil) : null,
    tenor: user?.member?.tenor ? new Date(user?.member?.tenor) : null,
    role: (user?.member?.role) || MemberRole.Member,
    tierExpiration: 0,
    deactivatedDate: 0,
    primaryPhone: user?.member?.contactInfo?.primaryPhone?.number || '',
    primaryPhoneReceive: !!user?.member?.contactInfo?.primaryPhone?.receiveTexts,
    primaryEmail: user?.member?.contactInfo?.primaryEmail.address,
    primaryEmailReceive: user?.member?.contactInfo?.primaryEmail.receiveEmails,
    secondaryPhone: user?.member?.contactInfo?.secondaryPhone?.number,
    secondaryPhoneReceive: user?.member?.contactInfo?.secondaryPhone?.receiveTexts,
    secondaryEmail: user?.member?.contactInfo?.secondaryEmail?.address,
    secondaryEmailReceive: user?.member?.contactInfo?.secondaryEmail?.receiveEmails,
    adminNote: user?.member?.adminNote || '',
    hourlyRate: user?.member?.hourlyRate || null,
    incidentHourlyRate: user?.member?.incidentHourlyRate || null,
    allowSelfCheckIn: user?.member?.allowSelfCheckIn || false,
  } as any;

  const methods = useForm({
    resolver: yupResolver(UpdateUserSchema),
    defaultValues,
  });

  const {
    setValue,
    setError,
    clearErrors,
    handleSubmit,
    watch,
    getValues,
    formState: { isSubmitting, errors: formErrors },
  } = methods;
  const tierUntil = watch('tierUntil');
  const division = watch('unit')?.divisions?.[0]?.name;

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
      if (adminViewer && d.tier === MemberTier.Tier_2 && !d.tierUntil && !user.member.tierResetOnNextLottery && !disabledTierUntil) {
        setError('tierUntil', { message: 'This field is required if tier 2 is selected' });
        return;
      }
      clearErrors('tierUntil')

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
              tenor: d.tenor,
              hourlyRate: d.hourlyRate || null,
              incidentHourlyRate: d.incidentHourlyRate || null,
              ...((adminViewer || lasdUserFields) && {
                rankId: d.rank.id,
                ...(d.unit?.divisions?.[0]?.id && {divisionId: d.unit.divisions[0].id}),
                ...(d.unit?.id && {unitId: d.unit.id}),
              }),
              ...(adminViewer && {
                role: d.role,
                tier: d.tier,
                tierUntil: d.tierUntil,
                adminNote: d.adminNote,
                status: d.status,
                allowSelfCheckIn: d.allowSelfCheckIn,
              }),
              contactInfo: {
                primaryEmail: {
                  address: d.primaryEmail?.trim(),
                  receiveEmails: d.primaryEmailReceive,
                },
                primaryPhone: {
                  number: d.primaryPhone.trim() === '1' ? '' : d.primaryPhone.trim(),
                  receiveTexts: d.primaryPhoneReceive,
                },
                ...(d.secondaryEmail && {
                  secondaryEmail: {
                    address: d.secondaryEmail?.trim(),
                    receiveEmails: !!d.secondaryEmailReceive,
                  }
                }),
                ...(d.secondaryPhone && d.secondaryPhone.trim() !== '1' && {
                  secondaryPhone: {
                    number: d.secondaryPhone.trim() === '1' ? '' : d.secondaryPhone.trim(),
                    receiveTexts: !!d.secondaryPhoneReceive,
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

      if (currentUser?.id === user.id) {
        await reInitialize();
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
      enqueueSnackbar('Failed to save changes. Please try again.', { variant: 'error' });
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
                  disabled={allDisabled}
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
              <RHFTextField disabled={!adminViewer || allDisabled || lasdUserFields} name="firstName" label="First Name" />
              <RHFTextField disabled={!adminViewer|| allDisabled || lasdUserFields} name="lastName" label="Last Name" />

              <RHFRankSelect name="rank" label="Rank" disabled={(!adminViewer && !lasdUserFields) || allDisabled} />
              
              <RHFTextField disabled={!adminViewer || allDisabled || lasdUserFields} name="pNumber" label={pNumberLabel} />

              <RHFSelect
                fullWidth
                name="role"
                label="Role"
                disabled={!adminViewer || allDisabled}
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
              {
                !disabledTiers &&
                <>
                  <RHFSelect
                    fullWidth
                    name="tier"
                    label="Tier"
                    disabled={!adminViewer || allDisabled}
                    InputLabelProps={{ shrink: true }}
                    PaperPropsSx={{ textTransform: 'capitalize' }}
                  >
                    {enabledTiers.map((option) => (
                      <MenuItem key={option} value={option}>
                        {tierNames[option]}
                      </MenuItem>
                    ))}
                  </RHFSelect>

                  {
                    !disabledTierUntil && (
                      <DatePicker
                        disabled={!adminViewer || allDisabled}
                        tz={user?.member?.org?.timezone!}
                        tierUntil={tierUntil}
                        helperText={tierUntilHelpText || formErrors.tierUntil?.message as any}
                        error={!!formErrors.tierUntil}
                        onChange={(hasValue) => {
                          const result = getValues()
                          if (result.tier === MemberTier.Tier_2 && !hasValue) {
                            setError('tierUntil', { message: 'This field is required if tier 2 is selected' });
                            return;
                          }
                          clearErrors('tierUntil')
                        }}
                        setTierUntil={(value: any) => setValue('tierUntil', value)}
                      />
                    )
                  }
                </>
              }
              {
                lasdUserFields && (
                  <>
                    <RHFDatePicker disabled={!adminViewer || allDisabled || lasdUserFields} name="tenor" label="Hire Date" />

                    <RHFUnitSelect name="unit" label="Unit of Assignment" disabled={allDisabled} />

                    <TextField
                      disabled
                      value={division || ''}
                      label="Division"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  </>
                )
              }
            </Box>
            <Divider sx={{ mt: 4, mb: 2 }} />
            {
              adminViewer && rankHourlyRate && (
                <>
                  <Typography sx={{ mb: 2 }} variant='h6'>Rates</Typography>
                  <Box
                    rowGap={3}
                    columnGap={2}
                    display="grid"
                    gridTemplateColumns={{
                      xs: 'repeat(1, 1fr)',
                      sm: 'repeat(2, 1fr)',
                    }}
                  >
                    <RHFTextField disabled={!adminViewer || allDisabled} type="number" name="hourlyRate" label="Hourly Rate" helperText="This field will override the hourly rate assigned to the officers rank." />
                    <RHFTextField disabled={!adminViewer || allDisabled} type="number" name="incidentHourlyRate" label="Incident Hourly Rate" helperText="This field will override the incident hourly rate assigned to the officers rank." />
                  </Box>
                  <Divider sx={{ mt: 4, mb: 2 }} />
                </>
              )
            }
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
                <RHFPhoneField disabled={!adminViewer || allDisabled} name="primaryPhone" label="Primary Phone" />
                <RHFSwitch disabled={!adminViewer || allDisabled} name="primaryPhoneReceive" label="Receive text messages" />
              </Box>

              <Box>
                <RHFTextField disabled={!adminViewer || allDisabled || lasdUserFields} name="primaryEmail" label="Primary Email" />
                <RHFSwitch disabled={!adminViewer || allDisabled} name="primaryEmailReceive" label="Receive emails" />
              </Box>

              <Box>
                <RHFPhoneField disabled={allDisabled} name="secondaryPhone" label="Secondary Phone" />
                <RHFSwitch disabled={allDisabled} name="secondaryPhoneReceive" label="Receive text messages" />
              </Box>

              <Box>
                <RHFTextField disabled={allDisabled} name="secondaryEmail" label="Secondary Email" />
                <RHFSwitch disabled={allDisabled} name="secondaryEmailReceive" label="Receive emails" />
              </Box>

            </Box>
            {
              adminViewer && (
                <>
                  <Divider sx={{ mt: 4, mb: 2 }} />
                  <Typography sx={{ mt: 3, mb: 2 }} variant='h6'>Admin Info</Typography>
                  <RHFTextField
                    disabled={allDisabled}
                    fullWidth
                    multiline
                    rows={4}
                    name="adminNote"
                    label="Admin Notes"
                  />
                </>
              )
            }
            {
              officerCheckInOut && (
                <RHFSwitch disabled={!adminViewer || allDisabled} name="allowSelfCheckIn" label="Allow Remote Check In/out" sx={{ mt: 1 }} helperText="Contact EOB staff for questions" />
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
