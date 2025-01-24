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
// Types
import { Rank, Equipment } from 'src/__generated__/resolvers-types';
import { GET_EQUIPMENTS, UPSERT_EQUIPMENT } from 'src/api/equipment';
import { GET_RANKS } from 'src/api/rank';

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
  ranksOnly: [],
  rankOnlyIds: []
}

export default function UpsertEquipmentDialogue({
  equipment,
  upsertEquipment,
  onUpsertEquipment = () => {},
}: InputProps) {
  const [rankSearchText, setRankSearchText] = useState('');
  const [equipmentMutation, { loading, error: equipmentError }] = useMutation(UPSERT_EQUIPMENT, {
    refetchQueries: [GET_EQUIPMENTS],
  });
  const { data } = useQuery(GET_RANKS, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: {
        active: true,
        ...(rankSearchText.trim() ? { query: rankSearchText.trim() } : {}),
      }
    }
  });
  const { ranks: { items: ranks } } = data || { ranks: { items: [] } };
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
        ranksOnly: (equipment.ranksOnly || []) as any,
        rankOnlyIds: (equipment.rankOnlyIds || []) as any,
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
            rankOnlyIds: equipmentMod.rankOnlyIds,
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

          <Autocomplete
            multiple
            id="checkboxes-tags-demo"
            options={ranks}
            disableCloseOnSelect
            fullWidth
            value={(equipmentMod?.ranksOnly || []) as any}
            sx={{ mt: 2 }}
            getOptionLabel={(option: Rank) => option.name}
            onChange={(_, value) => {
              setEquipmentMod((c) => ({
                ...c,
                ranksOnly: value as any,
                rankOnlyIds: value.map((v) => v.id) as any,
              }));
            }}
            renderOption={(props, option, { selected }) => (
              <li {...props} key={option?.id}>
                <Checkbox style={{ marginRight: 8 }} checked={selected} />
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
