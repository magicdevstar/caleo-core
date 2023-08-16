// react-
import { useCallback, useEffect, useMemo, useState } from 'react';

// @apollo/client
import { useMutation, useQuery } from '@apollo/client';

// @mui
import LoadingButton from '@mui/lab/LoadingButton';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';

// components
import { ConfirmDialog } from "src/components/custom-dialog";
// Types
import { MemberSkill, Skill, SkillStatus } from 'src/__generated__/resolvers-types';
import { GET_BASE_SKILLS } from 'src/api/skill';
import { GET_USER, ME, UPSERT_MEMBER_SKILL } from 'src/api/user';

const defaultMemberSkill = {
  id: '',
  imagePath: '',
  status: SkillStatus.Pending,
  skillId: '',
  skill: {} as Skill,
}

export default function UpsertMemberSkill({
  userId,
  rankId,
  memberSkill,
  upsertMemberSkill,
  onUpsertMemberSkill,
}: {
  userId: string;
  rankId: string;
  memberSkill: MemberSkill | null;
  upsertMemberSkill: ReturnType<any>;
  onUpsertMemberSkill: () => void;
}) {
  const { data } = useQuery(GET_BASE_SKILLS, {
    variables: {
      input: {
        limit: 1000,
        active: true,
        rankOnlyIds: [rankId],
      },
    }
  });
  const { skills: { items: possibleSkills } } = data || { skills: { items: [] } };

  const [userSkillMutation, { loading, error: skillError }] = useMutation(UPSERT_MEMBER_SKILL, {
    refetchQueries: [GET_USER, ME],
  });
  const [skillMod, setSkillMod] = useState(defaultMemberSkill);
  const [error, setError] = useState('');
  const [inputValue, setInputValue] = useState('');
  const action = useMemo(() => memberSkill ? 'Update' : 'Add', [memberSkill]);

  useEffect(() => {
    if (memberSkill) {
      setSkillMod({
        id: memberSkill.id,
        imagePath: memberSkill.imagePath || '',
        status: memberSkill.status,
        skillId: memberSkill.skillId,
        skill: memberSkill.skill,
      });
    }
  }, [memberSkill]);

  const onSubmit = async () => {
    try {
      if (!skillMod.skill || skillMod.skill.id.trim() === '') {
        const errorMessage = 'Please select a skill.';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
      await userSkillMutation({
        variables: {
          input: {
            id: skillMod.id,
            imagePath: skillMod.imagePath || '',
            status: skillMod.status,
            skillId: skillMod.skill.id,
            userId,
          },
        },
      });
      onUpsertMemberSkill();
      upsertMemberSkill.onFalse();
      setSkillMod(defaultMemberSkill);
    } catch(e) {
      console.error(e);
    }
  };

  const handleClose = useCallback(() => {
    setSkillMod(defaultMemberSkill);
    onUpsertMemberSkill();
    upsertMemberSkill.onFalse();
  }, [upsertMemberSkill, setSkillMod, onUpsertMemberSkill]);

  return (
    <ConfirmDialog
      open={upsertMemberSkill.value}
      onClose={handleClose}
      title={`${action} Skill`}
      content={
        <Autocomplete
          fullWidth
          disabled={!!memberSkill}
          options={possibleSkills}
          getOptionLabel={(option) => option.name || ''}
          value={skillMod?.skill || undefined}
          inputValue={inputValue}
          onInputChange={(event, newInputValue) => {
            setInputValue(newInputValue);
          }}
          sx={{ mt: 2 }}
          onChange={(_, value) => {
            setSkillMod((c) => ({
              ...c,
              skill: value as any,
              skillId: value?.id as any,
            }));
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              error={!!error}
              helperText={error || skillError?.message}
              label="Choose a skill"
              placeholder="Choose a skill"
            />
          )}
          renderOption={(props, option) => (
            <li {...props} key={option.id}>
              {option.name}
            </li>
          )}
        />
      }
      action={
        <LoadingButton onClick={onSubmit} variant="contained" loading={loading}>
          {action} Skill
        </LoadingButton>
      }
    />
  );
}