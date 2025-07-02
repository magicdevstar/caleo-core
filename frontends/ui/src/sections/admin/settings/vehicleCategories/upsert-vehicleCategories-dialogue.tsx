import { useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

// @apollo/client
import { useMutation } from '@apollo/client';

// @mui
import LoadingButton from '@mui/lab/LoadingButton';
import Stack from '@mui/material/Stack';

// components
import ConfirmDialogWithForm from "src/components/custom-dialog/confirm-dialog-with-form";
import { RHFSwitch, RHFTextField } from 'src/components/hook-form';
// Types
import { VehicleCategories } from 'src/__generated__/resolvers-types';
import { GET_VEHICLE_CATEGORIES, UPSERT_VEHICLE_CATEGORY } from 'src/api/vehicleCategories';

interface InputProps {
  data?: VehicleCategories | null;
  upsert: ReturnType<any>;
  onUpsert?: () => void;
}

// Validation schema using yup
const schema = yup.object().shape({
  name: yup.string().trim().required('Name is required'),
  active: yup.boolean().required('Active status is required'),
  milageRate: yup.number().min(0, 'Milage Rate must be a positive number').nullable(),
});

export default function UpsertVehicleCategoryDialogue({
  data,
  upsert,
  onUpsert = () => {},
}: InputProps) {
  const [mutate, { loading }] = useMutation(UPSERT_VEHICLE_CATEGORY, {
    refetchQueries: [GET_VEHICLE_CATEGORIES],
  });

  const action = useMemo(() => (data ? 'Update' : 'Create'), [data]);

  // Initialize react-hook-form with default values and validation schema
  const methods = useForm({
    defaultValues: {
      name: data?.name || '',
      active: data?.active || true,
      milageRate: data?.milageRate || 0,
    },
    resolver: yupResolver(schema),
  });

  const { handleSubmit, reset, setValue } = methods;

  useEffect(() => {
    if (data) {
      setValue('name', data.name);
      setValue('active', data.active);
      setValue('milageRate', data.milageRate);
    } else {
      reset();
    }
  }, [data, reset, setValue]);

  const onSubmit = async (formData: { name: string, active: boolean; milageRate: number | null }) => {
    try {
      await mutate({
        variables: {
          input: {
            id: data?.id,
            name: formData.name.trim(),
            active: data ? data.active : true,
            milageRate: formData.milageRate !== null ? formData.milageRate : undefined,
          },
        },
      });
      onUpsert();
      upsert.onFalse();
      reset();
    } catch (e) {
      console.error(e);
    }
  };

  const handleClose = useCallback(() => {
    reset();
    onUpsert();
    upsert.onFalse();
  }, [reset, onUpsert, upsert]);

  return (
    <ConfirmDialogWithForm
      methods={methods}
      handleSubmit={handleSubmit(onSubmit as any)}
      open={upsert.value}
      onClose={handleClose}
      title={`${action} Vehicle Category`}
      content={
        <Stack spacing={2} mt={1}>
          <RHFTextField name="name" label="Name" type="text" autoFocus />
          <RHFTextField name="milageRate" label="Milage Rate" type="number" placeholder="Enter milage rate" />
          <RHFSwitch name="active" label="Active" />
        </Stack>
      }
      action={
        <LoadingButton
          type="submit"
          variant="contained"
          loading={loading}
        >
          {action} Vehicle Category
        </LoadingButton>
      }
    />
  );
};
