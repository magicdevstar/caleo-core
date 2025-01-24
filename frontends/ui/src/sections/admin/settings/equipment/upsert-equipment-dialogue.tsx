// react-
import { useCallback, useEffect, useMemo, useState } from 'react';

// @apollo/client
import { useMutation } from '@apollo/client';

// @mui
import LoadingButton from '@mui/lab/LoadingButton';
import TextField from '@mui/material/TextField';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';

// components
import { ConfirmDialog } from "src/components/custom-dialog";
// Types
import { Equipment } from 'src/__generated__/resolvers-types';
import { GET_EQUIPMENTS, UPSERT_EQUIPMENT } from 'src/api/equipment';

interface InputProps {
  equipment?: Equipment | null;
  upsertEquipment: ReturnType<any>;
  onUpsertEquipment?: () => void;
}

const defaultEquipment = {
  name: '',
  active: true,
  requiresAdminApproval: false,
  requiresCert: false,
}

export default function UpsertEquipmentDialogue({
  equipment,
  upsertEquipment,
  onUpsertEquipment = () => {},
}: InputProps) {
  const [equipmentMutation, { loading, error: equipmentError }] = useMutation(UPSERT_EQUIPMENT, {
    refetchQueries: [GET_EQUIPMENTS],
  });
  const [equipmentMod, setEquipmentMod] = useState(defaultEquipment);
  const [error, setError] = useState('');
  const action = useMemo(() => equipment ? 'Update' : 'Create', [equipment]);

  useEffect(() => {
    if (equipment) {
      setEquipmentMod({
        name: equipment.name,
        active: equipment.active,
        requiresAdminApproval: equipment.requiresAdminApproval,
        requiresCert: equipment.requiresCert,
      });
    }
  }, [equipment])

  const onSubmit = async () => {
    try {
      if (equipmentMod.name.trim() === '') {
        const errorMessage = 'Name is required';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
      await equipmentMutation({
        variables: {
          input: {
            id: equipment?.id,
            name: equipmentMod.name.trim(),
            active: equipmentMod.active,
            requiresAdminApproval: equipmentMod.requiresAdminApproval,
            requiresCert: equipmentMod.requiresCert,
          },
        },
      });
      onUpsertEquipment();
      upsertEquipment.onFalse();
      setEquipmentMod(defaultEquipment);
    } catch(e) {
      console.error(e);
    }
  };

  const handleClose = useCallback(() => {
    setEquipmentMod(defaultEquipment);
    onUpsertEquipment();
    upsertEquipment.onFalse();
  }, [upsertEquipment, setEquipmentMod, onUpsertEquipment]);

  return (
    <ConfirmDialog
      open={upsertEquipment.value}
      onClose={handleClose}
      title={`${action} Equipment`}
      content={
        <>
          <TextField
            fullWidth
            label="Name"
            type="text"
            value={equipmentMod.name}
            sx={{ mt: 1 }}
            autoFocus
            onChange={(event) => {
              setEquipmentMod((c) => ({
                ...c,
                name: event.target.value,
              }));
            }}
            error={!!error || !!equipmentError}
            helperText={error || equipmentError?.message}
          />

          <FormGroup sx={{ mt: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  onChange={
                    (_, checked) =>
                      setEquipmentMod((c) =>
                      ({
                        ...c,
                        requiresAdminApproval: checked
                      }))
                  }
                  checked={equipmentMod.requiresAdminApproval} />
              }
              label="Requires admin approval"
            />
            <FormControlLabel
              control={
                <Switch
                  onChange={(_, checked) =>
                  setEquipmentMod((c) => ({
                    ...c,
                    requiresCert: checked
                  }))}
                  checked={equipmentMod.requiresCert}
                />
              }
              label="Requires certification"
            />
          </FormGroup>
        </>
      }
      action={
        <LoadingButton onClick={onSubmit} variant="contained" loading={loading}>
          {action} Equipment
        </LoadingButton>
      }
    />
  );
};
