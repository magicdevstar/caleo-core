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
import { MemberEquipment, Equipment, EquipmentStatus } from 'src/__generated__/resolvers-types';
import { CREATE_EQUIPMENT_UPLOAD_URL, GET_BASE_EQUIPMENT } from 'src/api/equipment';
import { GET_USER, ME, UPSERT_MEMBER_EQUIPMENT } from 'src/api/user';
import { Upload } from 'src/components/upload';
import { useBoolean } from 'src/hooks/use-boolean';

const defaultMemberEquipment = {
  id: '',
  imagePath: '',
  status: EquipmentStatus.Pending,
  equipmentId: '',
  equipment: {} as Equipment,
}

export default function UpsertMemberEquipment({
  userId,
  rankId,
  memberEquipment,
  upsertMemberEquipment,
  existingEquipment,
  onUpsertMemberEquipment,
}: {
  userId: string;
  rankId: string;
  memberEquipment: MemberEquipment | null;
  existingEquipment: MemberEquipment[];
  upsertMemberEquipment: ReturnType<any>;
  onUpsertMemberEquipment: () => void;
}) {
  const { data } = useQuery(GET_BASE_EQUIPMENT, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: {
        active: true,
        rankOnlyIds: [rankId],
      },
    }
  });

  const possibleEquipment = useMemo(() => {
    const { equipments: { items } } = data || { equipments: { items: [] } };
    const existingEquipmentIds = existingEquipment.map((e) => e.equipment.id);
    return items.filter((equipment: Equipment) => !existingEquipmentIds.includes(equipment.id));
  }, [data, existingEquipment]);

  const [createUploadLink] = useMutation(CREATE_EQUIPMENT_UPLOAD_URL);
  const [userEquipmentMutation, { loading, error: equipmentError }] = useMutation(UPSERT_MEMBER_EQUIPMENT, {
    refetchQueries: [GET_USER, ME],
  });
  const [equipmentMod, setEquipmentMod] = useState(defaultMemberEquipment);
  const [requiresImage, setRequiresImage] = useState<boolean>(false);
  const [error, setError] = useState('');
  const [loadingImage, setLoadingImage] = useState(!!memberEquipment);
  const [document, setDocument] = useState<any>(null);
  const [inputValue, setInputValue] = useState('');
  const action = useMemo(() => memberEquipment ? 'Update' : 'Add', [memberEquipment]);

  const touchedImage = useBoolean();

  useEffect(() => {
    if (memberEquipment) {
      setLoadingImage(true);
      setRequiresImage(memberEquipment.equipment.requiresCert);
      setEquipmentMod({
        id: memberEquipment.id,
        imagePath: memberEquipment.imagePath || '',
        status: memberEquipment.status,
        equipmentId: memberEquipment.equipmentId,
        equipment: memberEquipment.equipment,
      });
      if (memberEquipment.image) {
        fetch(memberEquipment.image)
          .then((res) => res.blob())
          .then((blob) => {
            const fileName = memberEquipment.image || 'file';
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
      setEquipmentMod(defaultMemberEquipment);
      setDocument(null);
      setLoadingImage(false);
    }
  }, [memberEquipment, setDocument, setLoadingImage, setRequiresImage]);

  const validSubmit = requiresImage ? !!(requiresImage && document) : true;

  const onSubmit = async () => {
    try {
      if (!equipmentMod.equipment || equipmentMod.equipment.id.trim() === '') {
        const errorMessage = 'Please select a equipment.';
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      let imagePath;
      let uploadUrl;
      if (document) {
        const {
          data: {
            userEquipmentAttachmentUploadUrl: {
              imagePath: imagePathFromServer,
              uploadUrl: uploadUrlFromServer,
            },
          }
        } = await createUploadLink();
        imagePath = imagePathFromServer;
        uploadUrl = uploadUrlFromServer;
      }

      await userEquipmentMutation({
        variables: {
          input: {
            id: equipmentMod.id,
            imagePath,
            status: equipmentMod.status,
            equipmentId: equipmentMod.equipment.id,
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

      onUpsertMemberEquipment();
      upsertMemberEquipment.onFalse();
      touchedImage.onFalse();
      setEquipmentMod(defaultMemberEquipment);
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
    setEquipmentMod(defaultMemberEquipment);
    setDocument(null);
    touchedImage.onFalse();
    onUpsertMemberEquipment();
    upsertMemberEquipment.onFalse();
  }, [upsertMemberEquipment, setEquipmentMod, onUpsertMemberEquipment, setDocument, touchedImage]);

  return (
    <ConfirmDialog
      open={upsertMemberEquipment.value}
      onClose={handleClose}
      maxWidth='sm'
      title={`${action} Equipment`}
      content={(
        <Stack spacing={2}>
          <Autocomplete
            fullWidth
            disabled={!!memberEquipment}
            options={possibleEquipment}
            getOptionLabel={(option) => option.name || ''}
            value={equipmentMod?.equipment || undefined}
            inputValue={inputValue}
            onInputChange={(event, newInputValue) => {
              setInputValue(newInputValue);
            }}
            sx={{ mt: 2 }}
            onChange={(_, value) => {
              setRequiresImage(!!value?.requiresCert);
              setEquipmentMod((c) => ({
                ...c,
                equipment: value as any,
                equipmentId: value?.id as any,
              }));
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                error={!!error}
                helperText={error || equipmentError?.message}
                label="Choose a equipment"
                placeholder="Choose a equipment"
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
        <LoadingButton disabled={(!touchedImage.value && !!memberEquipment) || !validSubmit} onClick={onSubmit} variant="contained" loading={loading}>
          {action} Equipment
        </LoadingButton>
      }
    />
  );
}