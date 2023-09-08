// react-
import { useCallback, useEffect, useMemo, useState } from 'react';

// @apollo/client
import { useMutation, useQuery } from '@apollo/client';

// @mui
import LoadingButton from '@mui/lab/LoadingButton';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';

// components
import { ConfirmDialog } from "src/components/custom-dialog";
// Types
import { MemberSkill, Skill, SkillStatus } from 'src/__generated__/resolvers-types';
import { CREATE_SKILL_UPLOAD_URL, GET_BASE_SKILLS } from 'src/api/skill';
import { GET_USER, ME, UPSERT_MEMBER_SKILL } from 'src/api/user';
import { Upload } from 'src/components/upload';
import { useBoolean } from 'src/hooks/use-boolean';

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
        active: true,
        rankOnlyIds: [rankId],
      },
    }
  });
  const { skills: { items: possibleSkills } } = data || { skills: { items: [] } };

  const [createUploadLink] = useMutation(CREATE_SKILL_UPLOAD_URL);
  const [userSkillMutation, { loading, error: skillError }] = useMutation(UPSERT_MEMBER_SKILL, {
    refetchQueries: [GET_USER, ME],
  });
  const [skillMod, setSkillMod] = useState(defaultMemberSkill);
  const [requiresImage, setRequiresImage] = useState<boolean>(false);
  const [error, setError] = useState('');
  const [loadingImage, setLoadingImage] = useState(!!memberSkill);
  const [document, setDocument] = useState<any>(null);
  const [inputValue, setInputValue] = useState('');
  const action = useMemo(() => memberSkill ? 'Update' : 'Add', [memberSkill]);

  const touchedImage = useBoolean();

  useEffect(() => {
    if (memberSkill) {
      setLoadingImage(true);
      if (memberSkill.skill.requiresCert) {
        setRequiresImage(true);
      }
      setSkillMod({
        id: memberSkill.id,
        imagePath: memberSkill.imagePath || '',
        status: memberSkill.status,
        skillId: memberSkill.skillId,
        skill: memberSkill.skill,
      });
      if (memberSkill.image) {
        fetch(memberSkill.image)
          .then((res) => res.blob())
          .then((blob) => {
            const fileName = memberSkill.image || 'file';
            const file = new File([blob], fileName);
            setDocument(Object.assign(file, {
              preview: URL.createObjectURL(file),
            }));
            setLoadingImage(false);
          }).catch((downloadError) => {
            console.error(downloadError);
          });
      } else {
        setLoadingImage(false);
      }
    } else {
      setRequiresImage(false);
      setSkillMod(defaultMemberSkill);
      setDocument(null);
      setLoadingImage(false);
    }
  }, [memberSkill, setDocument, setLoadingImage, setRequiresImage]);

  const validSubmit = requiresImage ? !!(requiresImage && document) : true;

  const onSubmit = async () => {
    try {
      if (!skillMod.skill || skillMod.skill.id.trim() === '') {
        const errorMessage = 'Please select a skill.';
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      let imagePath;
      let uploadUrl;
      if (document) {
        const {
          data: {
            userSkillAttachmentUploadUrl: {
              imagePath: imagePathFromServer,
              uploadUrl: uploadUrlFromServer,
            },
          }
        } = await createUploadLink();
        imagePath = imagePathFromServer;
        uploadUrl = uploadUrlFromServer;
      }

      await userSkillMutation({
        variables: {
          input: {
            id: skillMod.id,
            imagePath,
            status: skillMod.status,
            skillId: skillMod.skill.id,
            userId,
          },
        },
      });

      if (document && uploadUrl) {
        // Upload file to S3
        await fetch(uploadUrl, {
          method: 'PUT',
          body: document,
          headers: {
            'Content-Type': document.type,
          },
        });
      }

      onUpsertMemberSkill();
      upsertMemberSkill.onFalse();
      touchedImage.onFalse();
      setSkillMod(defaultMemberSkill);
      setDocument(null);
    } catch(e) {
      console.error(e);
    }
  };

  const handleDrop = useCallback(
    (files: File[]) => {
      touchedImage.onTrue();
      const file = files[0];
      const fileObj = Object.assign(file, {
        preview: URL.createObjectURL(file),
      });

      setDocument(fileObj);
    },
    [setDocument, touchedImage]
  );

  const handleRemoveFile = useCallback(
    () => {
      setDocument(null);
    },
    [setDocument]
  );

  const handleClose = useCallback(() => {
    setSkillMod(defaultMemberSkill);
    setDocument(null);
    touchedImage.onFalse();
    onUpsertMemberSkill();
    upsertMemberSkill.onFalse();
  }, [upsertMemberSkill, setSkillMod, onUpsertMemberSkill, setDocument, touchedImage]);

  return (
    <ConfirmDialog
      open={upsertMemberSkill.value}
      onClose={handleClose}
      maxWidth='sm'
      title={`${action} Skill`}
      content={(
        <Stack spacing={2}>
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
              if (value?.requiresCert) {
                setRequiresImage(true)
              }
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
          <Stack spacing={1.5}>
            {loadingImage ? (
              <Skeleton  sx={{ height: 250, width: '100%' }} />
            ) : (
              <Upload
                accept={{ 'image/*': [] }}
                file={document}
                thumbnail
                maxSize={3145728}
                onDrop={handleDrop}
                onRemove={handleRemoveFile}
                helperText={(<Typography color="grey" variant='caption'>Upload {requiresImage ? 'a' : 'an optional'} certification document</Typography>)}
              />
            )}
          </Stack>
        </Stack>
      )}
      action={
        <LoadingButton disabled={(!touchedImage.value && !!memberSkill) || !validSubmit} onClick={onSubmit} variant="contained" loading={loading}>
          {action} Skill
        </LoadingButton>
      }
    />
  );
}