// react-
import { useCallback, useEffect, useMemo, useState } from 'react';

// @apollo/client
import { useMutation, useQuery } from '@apollo/client';

// @mui
import LoadingButton from '@mui/lab/LoadingButton';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import Autocomplete from '@mui/material/Autocomplete';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';

// components
import { ConfirmDialog } from "src/components/custom-dialog";
import Iconify from 'src/components/iconify/iconify';
// Types
import { Rank, Skill } from 'src/__generated__/resolvers-types';
import { GET_SKILLS, UPSERT_SKILL } from 'src/api/skill';
import { GET_RANKS } from 'src/api/rank';

const icon = <Iconify color="primary" icon="mdi:checkbox-blank-outline" width={32} />
const checkedIcon = <Iconify color="primary" icon="mdi:checkbox-outline" width={32} />

interface InputProps {
  skill?: Skill | null;
  upsertSkill: ReturnType<any>;
  onUpsertSkill?: () => void;
}

const defaultSkill = {
  name: '',
  active: true,
  requiresAdminApproval: false,
  requiresCert: false,
  rankOnlyIds: []
}

export default function UpsertSkillDialogue({
  skill,
  upsertSkill,
  onUpsertSkill = () => {},
}: InputProps) {
  const [rankSearchText, setRankSearchText] = useState('');
  const [skillMutation, { loading, error: skillError }] = useMutation(UPSERT_SKILL, {
    refetchQueries: [GET_SKILLS],
  });
  const { data, loading: loadingRanks } = useQuery(GET_RANKS, {
    variables: {
      input: {
        limit: 10,
        active: true,
        ...(rankSearchText.trim() ? { query: rankSearchText.trim() } : {}),
      }
    }
  });
  const { ranks: { items: ranks } } = data || { ranks: { items: [] } };
  const [skillMod, setSkillMod] = useState(defaultSkill);
  const [error, setError] = useState('');
  const action = useMemo(() => skill ? 'Update' : 'Create', [skill]);

  useEffect(() => {
    if (skill) {
      setSkillMod({
        name: skill.name,
        active: skill.active,
        requiresAdminApproval: skill.requiresAdminApproval,
        requiresCert: skill.requiresCert,
        rankOnlyIds: (skill.rankOnlyIds || []) as any,
      });
    }
  }, [skill])

  const onSubmit = async () => {
    try {
      if (skillMod.name.trim() === '') {
        const errorMessage = 'Name is required';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
      await skillMutation({
        variables: {
          input: {
            id: skill?.id,
            name: skillMod.name.trim(),
            active: skillMod.active,
            requiresAdminApproval: skillMod.requiresAdminApproval,
            requiresCert: skillMod.requiresCert,
            rankOnlyIds: skillMod.rankOnlyIds,
          },
        },
      });
      onUpsertSkill();
      upsertSkill.onFalse();
      setSkillMod(defaultSkill);
    } catch(e) {
      console.error(e);
    }
  };

  const handleClose = useCallback(() => {
    setSkillMod(defaultSkill);
    onUpsertSkill();
    upsertSkill.onFalse();
  }, [upsertSkill, setSkillMod, onUpsertSkill]);

  return (
    <ConfirmDialog
      open={upsertSkill.value}
      onClose={handleClose}
      title={`${action} Skill`}
      content={
        <>
          <TextField
            fullWidth
            label="Name"
            type="text"
            value={skillMod.name}
            sx={{ mt: 1 }}
            autoFocus
            onChange={(event) => {
              setSkillMod((c) => ({
                ...c,
                name: event.target.value,
              }));
            }}
            error={!!error || !!skillError}
            helperText={error || skillError?.message}
          />

          <Autocomplete
            multiple
            id="checkboxes-tags-demo"
            options={ranks}
            disableCloseOnSelect
            fullWidth
            sx={{ mt: 2 }}
            getOptionLabel={(option: Rank) => option.name}
            onChange={(_, value) => {
              setSkillMod((c) => ({
                ...c,
                rankOnlyIds: value.map((v) => v.id) as any,
              }));
            }}
            renderOption={(props, option, { selected }) => (
              <li {...props}>
                <Checkbox
                  icon={icon}
                  checkedIcon={checkedIcon}
                  style={{ marginRight: 8 }}
                  checked={selected}
                />
                {option.name}
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                value={rankSearchText}
                onChange={(event) => {
                  setRankSearchText(event.target.value);
                }}
                label="Open to roles"
                placeholder="Search for roles"
              />
            )}
          />

          <FormGroup sx={{ mt: 1 }}>
            <FormControlLabel control={<Switch onChange={(_, checked) => setSkillMod((c) => ({ ...c, requiresAdminApproval: checked }))} value={skillMod.requiresAdminApproval} />} label="Requires admin approval" />
            <FormControlLabel control={<Switch onChange={(_, checked) => setSkillMod((c) => ({ ...c, requiresCert: checked }))} value={skillMod.requiresCert} />} label="Requires certification" />
          </FormGroup>
        </>
      }
      action={
        <LoadingButton onClick={onSubmit} variant="contained" loading={loading}>
          {action} Skill
        </LoadingButton>
      }
    />
  );
};
