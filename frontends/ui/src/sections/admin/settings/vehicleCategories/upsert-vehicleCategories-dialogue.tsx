// react-
import { useCallback, useEffect, useMemo, useState } from 'react';

// @apollo/client
import { useMutation } from '@apollo/client';

// @mui
import LoadingButton from '@mui/lab/LoadingButton';
import TextField from '@mui/material/TextField';

// components
import { ConfirmDialog } from "src/components/custom-dialog";
// Types
import { VehicleCategories } from 'src/__generated__/resolvers-types';
import { GET_VEHICLE_CATEGORIES, UPSERT_VEHICLE_CATEGORY } from 'src/api/vehicleCategories';

interface InputProps {
  data?: VehicleCategories | null;
  upsert: ReturnType<any>;
  onUpsert?: () => void;
}

export default function UpsertVehicleCategoryDialogue({
  data,
  upsert,
  onUpsert = () => {},
}: InputProps) {
  const [mutate, { loading, error: newGQLError }] = useMutation(UPSERT_VEHICLE_CATEGORY, {
    refetchQueries: [GET_VEHICLE_CATEGORIES],
  });
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const action = useMemo(() => data ? 'Update' : 'Create', [data]);

  useEffect(() => {
    if (data) {
      setName(data.name);
    } else {
      setName('');
    }
  }, [data])

  const onSubmit = async () => {
    try {
      if (name.trim() === '') {
        const errorMessage = 'Name is required';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
      await mutate({
        variables: {
          input: {
            id: data?.id,
            name: name.trim(),
            active: data ? data.active : true,
          },
        },
      });
      onUpsert();
      upsert.onFalse();
      setName('');
    } catch(e) {
      console.error(e);
    }
  };

  const handleClose = useCallback(() => {
    setName('');
    onUpsert();
    upsert.onFalse();
  }, [upsert, setName, onUpsert]);

  return (
    <ConfirmDialog
      open={upsert.value}
      onClose={handleClose}
      title={`${action} Vehicle Category`}
      content={
        <TextField
          fullWidth
          label="Name"
          type="text"
          autoFocus
          value={name}
          sx={{ mt: 1 }}
          onChange={(event) => {
            setName(event.target.value);
          }}
          error={!!error || !!newGQLError}
          helperText={error || newGQLError?.message}
        />
      }
      action={
        <LoadingButton onClick={onSubmit} variant="contained" loading={loading}>
          {action} Vehicle Category
        </LoadingButton>
      }
    />
  );
};
