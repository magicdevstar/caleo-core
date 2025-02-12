import { useCallback, useMemo, useState } from "react";
import { useSnackbar } from "notistack";
import { useQuery } from "@apollo/client";
import dayjs from 'dayjs';
// @mui
import LoadingButton from "@mui/lab/LoadingButton";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Grid from "@mui/material/Grid";
import Switch from "@mui/material/Switch";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
// components
import { ConfirmDialog } from "src/components/custom-dialog";
// Types
import { UseBooleanReturnType } from "src/hooks/use-boolean";
import { GET_RANKS } from "src/api/rank";
import { MemberRole, Rank } from "src/__generated__/resolvers-types";
import { client } from "src/utils/apollo";
import { SEND_INVITATION } from "src/api/user";
import { useFeatures } from "src/hooks/use-features";
import { useAuthContext } from "src/auth/hooks";
import { usePNumberLabel } from "src/hooks/use-pNumber-label";
import { useTiers } from "src/hooks/use-tiers";

// eslint-disable-next-line no-control-regex
const emailValidator = (email: string) => /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/.test(email);

const defaultUser = {
  email: '',
  member: {
    tier: '',
    role: MemberRole.Member,
    rankId: '',
    tenor: new Date(),
    pNumber: '',
  },
};

const defaultValidField = {
  touched: false,
  valid: false,
};

export default function InviteUserModal({
  inviteUser,
}: {
  inviteUser: UseBooleanReturnType;
}) {
  const { user: { member: { orgId } } } = useAuthContext();
  const { pNumberLabel } = usePNumberLabel();
  const { tierNames, enabledTiers } = useTiers();
  const { lasdUserFields, disabledTiers } = useFeatures();
  const { enqueueSnackbar } = useSnackbar();
  const { data } = useQuery(GET_RANKS, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: {
        active: true,
      },
    },
  });
  const allRanks = data?.ranks?.items || [];

  const [submitting, setSubmitting] = useState(false);
  const [validEmail, setValidEmail] = useState(defaultValidField);
  const [validPNumber, setValidPNumber] = useState(defaultValidField);
  const [validTenor, setValidTenor] = useState(defaultValidField);
  const [user, setUser] = useState({
    ...defaultUser,
    orgId,
  });

  const valid = useMemo(() => {
    const validTier = disabledTiers ? true : user.member.tier.trim() !== '';
    const validDate = lasdUserFields ? user.member.tenor !== null : true;
    const validP = lasdUserFields ? user.member.pNumber.trim() !== '' : true;

    return user.email.trim() !== '' && emailValidator(user.email) &&
      validTier &&
      validDate &&
      validP &&
      user.member.role.trim() !== '' &&
      user.member.rankId.trim() !== '';
  }, [user, disabledTiers, lasdUserFields]);

  const resetForm = useCallback(() => {
    setUser({
      ...defaultUser,
      orgId,
    });
    setValidEmail(defaultValidField);
    setValidPNumber(defaultValidField);
    setValidTenor(defaultValidField);
  }, [
    orgId,
    setUser,
    setValidEmail,
    setValidPNumber,
    setValidTenor
  ]);

  const handleClose = useCallback(() => {
    inviteUser.onFalse();
    resetForm();
  }, [inviteUser, resetForm]);

  const invite = useCallback(async () => {
    try {
      setSubmitting(true);
      await client.mutate({
        mutation: SEND_INVITATION,
        variables: {
          user,
        },
      });
      enqueueSnackbar('Invitation sent!', {
        variant: 'success',
        autoHideDuration: 4000,
      });
    } catch(error) {
      enqueueSnackbar('Failed to send invitation. Please try again later.', {
        variant: 'error',
        autoHideDuration: 4000,
      });
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  }, [user, enqueueSnackbar]);

  return (
    <ConfirmDialog
      maxWidth="md"
      open={inviteUser.value}
      onClose={handleClose}
      title="Invite User"
      content={(
        <Grid sx={{ mt: 1 }} container spacing={2}>
          <Grid item sm={12} md={6}>
            <TextField
              fullWidth
              error={validEmail.touched && !validEmail.valid}
              label="Email"
              value={user.email}
              helperText={validEmail.touched && !validEmail.valid && 'Please enter a valid email address'}
              onBlur={() => {
                setValidEmail((c) => ({
                  ...c,
                  touched: true,
                }));
              }}
              onChange={(event) => {
                setValidEmail((c) => ({
                  ...c,
                  valid: emailValidator(event.target.value),
                }));
                setUser((c) => ({
                  ...c,
                  email: event.target.value,
                }));
              }}
            />
          </Grid>
          {
            !disabledTiers && (
              <Grid item sm={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Tier</InputLabel>
                  <Select
                    value={user.member.tier}
                    label="Tier"
                    onChange={(event) => {
                      setUser((c) => ({
                        ...c,
                        member: {
                          ...c.member,
                          tier: event.target.value,
                        },
                      }));
                    }}
                  >
                    {enabledTiers.map((option) => (
                      <MenuItem key={option} value={option}>
                        {tierNames[option]}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )
          }
          {
            lasdUserFields && (
              <>
                <Grid item sm={12} md={6}>
                  <DatePicker
                    label="Hire Date"
                    onChange={(newValue) => {
                      setValidTenor((c) => ({
                        touched: true,
                        valid: true,
                      }));
                      setUser((c) => ({
                        ...c,
                        member: {
                          ...c.member,
                          tenor: newValue!.toDate(),
                        }
                      }));
                    }}
                    value={dayjs(user.member.tenor)} // keeps field empty if value is null or undefined
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: validTenor.touched && !validTenor.valid,
                      },
                    }}
                  />
                </Grid>
                <Grid item sm={12} md={6}>
                  <TextField
                    fullWidth
                    error={validPNumber.touched && !validPNumber.valid}
                    label={pNumberLabel}
                    value={user.member.pNumber}
                    onBlur={() => {
                      setValidPNumber((c) => ({
                        ...c,
                        touched: true,
                      }));
                    }}
                    onChange={(event) => {
                      setValidPNumber((c) => ({
                        ...c,
                        valid: event.target.value.trim() !== '',
                      }));
                      setUser((c) => ({
                        ...c,
                        member: {
                          ...c.member,
                          pNumber: event.target.value,
                        }
                      }));
                    }}
                  />
                </Grid>
              </>
            )
          }
          <Grid item sm={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Rank</InputLabel>
              <Select
                value={user.member.rankId}
                label="Rank"
                onChange={(event) => {
                  setUser((c) => ({
                    ...c,
                    member: {
                      ...c.member,
                      rankId: event.target.value,
                    },
                  }));
                }}
              >
                {allRanks.map((option: Rank) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item sm={12} md={12}>
            <FormGroup>
              <FormControlLabel
                label="Admin"
                control={
                  <Switch
                    onChange={(e, checked) => {
                      let role = MemberRole.Member;
                      if (checked) {
                        role = MemberRole.Admin;
                      }
                      setUser((c) => ({
                        ...c,
                        member: {
                          ...c.member,
                          role,
                        },
                      }));
                    }}
                  />
                }
              />
            </FormGroup>
          </Grid>
        </Grid>
      )}
      action={
        <LoadingButton
          loading={submitting}
          disabled={!valid}
          variant="contained"
          onClick={invite}
        >
          Invite User
        </LoadingButton>
      }
    />
  );
}
