import { useMemo } from "react";
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@apollo/client';
import * as Yup from 'yup';
import { yupResolver } from "@hookform/resolvers/yup";

// @mui
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import Typography from "@mui/material/Typography";
import { LoadingButton } from "@mui/lab";
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

// Types
import { MemberStatus, MemberTier, MemberRole, User, Rank, } from "src/__generated__/resolvers-types";
import { GET_ACCOUNT_REQUEST_USERS, UPDATE_USER, } from "src/api/user";
import { GET_RANKS } from 'src/api/rank';

// Components
import FormProvider, {
  RHFAutocomplete,
  RHFDatePicker,
  RHFSelect,
  RHFTextField,
} from 'src/components/hook-form';
import { useFeatures } from "src/hooks/use-features";
import { usePNumberLabel } from "src/hooks/use-pNumber-label";
import { useTiers } from "src/hooks/use-tiers";

const roleNames = {
  [MemberRole.Admin]: 'Admin',
  [MemberRole.Member]: 'Member',
};

export default function AccountRequestsDialog({
  userRequest,
  open,
  onClose,
} : {
  userRequest: { user: User, approve: Boolean } | null,
  open: boolean,
  onClose: VoidFunction
}) {
  const { tierNames, enabledTiers } = useTiers();
  const { pNumberLabel } = usePNumberLabel();
  const { disabledTiers, lasdUserFields } = useFeatures();
  const [updateUser] = useMutation(UPDATE_USER, {
    refetchQueries: [ GET_ACCOUNT_REQUEST_USERS ]
  });

  const reviewUserSchema = Yup.object().shape({
    firstName: Yup.string(),
    lastName: Yup.string(),
    member: Yup.object().shape({
      rank: Yup.object().when('$approve', ([approve], schema) => approve ? schema.required('Rank is required') : schema.nullable()),
      pNumber: userRequest?.approve ? Yup.string().required(`${pNumberLabel} is required`) : Yup.string(),
      rankId: Yup.string().nullable().when(['$approve', 'rank'], ([approve, rank], schema) => approve ? schema.transform(() => rank?.id) : schema),
      tenor: lasdUserFields && userRequest?.approve ? Yup.date().nullable().required('Tenor is required') : Yup.date().nullable(),
      tier: disabledTiers && userRequest?.approve ? Yup.mixed<MemberTier>().oneOf(Object.values(MemberTier)) : Yup.mixed<MemberTier>().oneOf(Object.values(MemberTier)).required('Tier is required'),
      role: userRequest?.approve ? Yup.mixed<MemberRole>().oneOf(Object.values(MemberRole)).required('Role is required') : Yup.mixed<MemberRole>().oneOf(Object.values(MemberRole)),
      adminNote: Yup.string().nullable().transform((value) => value || null),
      status: Yup.string().when('$approve', ([approve], schema) => schema.transform(() => approve ? MemberStatus.Active : MemberStatus.Inactive)),
      contactInfo: Yup.object().shape({
        primaryPhone: Yup.object().shape({
          number: Yup.string().nullable(),
        }),
        primaryEmail: Yup.object().shape({
          number: Yup.string(),
        }),
      })
    }),
  });
  
  const updateUserSchema = Yup.object().shape({
    id: Yup.string(),
    cognitoId: Yup.string(),
    firstName: Yup.string(),
    lastName: Yup.string(),
    member: Yup.object().shape({
      adminNote: Yup.string().nullable(),
      orgId: Yup.string(),
      pNumber: Yup.string(),
      rankId: Yup.string().nullable(),
      role: Yup.string(),
      status: Yup.string(),
      tier: Yup.string(),
      tenor: Yup.date().nullable(),
    }),
  });

  const methods = useForm({
    resolver: yupResolver(reviewUserSchema),
    context: { approve: userRequest?.approve },
    values: {
      ...userRequest?.user,
      member: {
        ...userRequest?.user?.member,
        adminNote: ''
      }
    } as any,
  });

  const { data, loading } = useQuery(GET_RANKS, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: {},
    },
  });
  const ranks = useMemo(() => data?.ranks?.items || [], [data]);

  const closeDialog = () => {
    methods.reset();
    onClose();
  }

  const onSubmit = async (formValues: any) => {
    const input = updateUserSchema.cast(formValues, { stripUnknown: true });
    try {
      await updateUser({
        variables: {
          input
        }
      });
      closeDialog();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      open={open}
      onClose={onClose}
    >
      <FormProvider methods={methods} onSubmit={methods.handleSubmit(onSubmit)}>
        <DialogTitle sx={{ pb: 2 }}>{userRequest?.approve ? 'Approve Account Request' : 'Deny Account Request'}</DialogTitle>
        <DialogContent>
          {userRequest?.approve ? (
            <>
              <Box
                display="grid"
                rowGap={3}
                columnGap={2}
                sx={{ p: 1, mb: 1 }}
                gridTemplateColumns={{
                  xs: 'repeat(1, 1fr)',
                  sm: 'repeat(3, 1fr)',
                }}
              >
                <RHFTextField name="firstName" label="First Name" disabled/>
                <RHFTextField name="lastName" label="Last Name" disabled />
                <RHFTextField name="member.pNumber" label={pNumberLabel} />
              </Box>
              <Box
                display="grid"
                rowGap={3}
                columnGap={2}
                sx={{ p: 1 }}
                gridTemplateColumns={{
                  xs: 'repeat(1, 1fr)',
                  sm: 'repeat(2, 1fr)',
                }}
              >
                <RHFTextField name="member.contactInfo.primaryEmail.address" label="Email Address" disabled />
                <RHFTextField name="member.contactInfo.primaryPhone.number" label="Primary Phone" disabled />
              </Box>
              <Divider sx={{ mt: 2, mb: 2 }} />
              <Box
                display="grid"
                rowGap={3}
                columnGap={2}
                sx={{ p: 1, mb: 1 }}
                gridTemplateColumns={{
                  xs: 'repeat(1, 1fr)',
                }}
              >
                <RHFAutocomplete
                  name="member.rank"
                  label="Rank"
                  options={ranks}
                  loading={loading}
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
              </Box>
              <Box
                display="grid"
                rowGap={3}
                columnGap={2}
                sx={{ p: 1, mb: 1 }}
                gridTemplateColumns={{
                  xs: 'repeat(1, 1fr)',
                  sm: 'repeat(2, 1fr)',
                }}
              >
                <RHFSelect
                  fullWidth
                  name="member.role"
                  label="Role"
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
                {
                  !disabledTiers && (
                    <RHFSelect
                      fullWidth
                      name="member.tier"
                      label="Tier"
                      InputLabelProps={{ shrink: true }}
                      PaperPropsSx={{ textTransform: 'capitalize' }}
                    >
                      {enabledTiers.map((option) => (
                        <MenuItem key={option} value={option}>
                          {tierNames[option]}
                        </MenuItem>
                      ))}
                    </RHFSelect>
                  )
                }
                {
                  lasdUserFields && (
                    <RHFDatePicker
                      name="member.tenor"
                      label="Hire Date"
                    />
                  )
                }
              </Box>
              <Box
                display="grid"
                rowGap={3}
                columnGap={2}
                sx={{ p: 1, pb: 0 }}
                gridTemplateColumns={{
                  xs: 'repeat(1, 1fr)',
                }}
              >
                <RHFTextField fullWidth multiline rows={4} name="member.adminNote" label="Admin Notes" />
                <Typography variant="body2" sx={{ pl: 1, pr: 1 }}>
                  {`Once approved, ${userRequest?.user?.firstName} will have access to the system as dictated by their Rank.`}
                </Typography>
              </Box>
            </>
          ) : (
            <Typography variant="body1">
              {`${userRequest?.user?.firstName} will receive an email letting them know their account request was denied. Are you sure you want to proceed?`}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <LoadingButton
            type="submit"
            variant="contained"
            color={userRequest?.approve ? 'primary' : 'error'}
            loading={methods.formState.isSubmitting}
          >
            {userRequest?.approve ? 'Approve' : 'Deny'}
          </LoadingButton>
          <Button variant="outlined" color="inherit" onClick={closeDialog}>
            Cancel
          </Button>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
}
