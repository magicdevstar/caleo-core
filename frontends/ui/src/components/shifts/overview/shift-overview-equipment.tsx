import { useMemo } from 'react';
// @mui
import Stack from '@mui/material/Stack';
import Grid from "@mui/material/Grid";
// types
import { Shift } from 'src/__generated__/resolvers-types';
// components
import { RHFVehicleCategoriesSelect } from 'src/components/hook-form/rhf-vehicle-categories-select';
import ShiftOverviewDetail from './shift-overview-detail';

interface Props {
  shift?: Shift;
  isAdminView: boolean;
}

export default function ShiftOverviewEquipment({ shift, isAdminView }: Props) {
  const equipment = useMemo(() => {
    const vehicleMake = shift?.docusignEvent?.signerDetails?.[0]?.data?.vehicleMake;
    const vehicleModel = shift?.docusignEvent?.signerDetails?.[0]?.data?.vehicleModel;

    if (vehicleMake && vehicleModel) {
      return `${vehicleMake} - ${vehicleModel}`;
    }
    return undefined;
  }, [shift]);

  return (
    <Stack spacing={3}>
      <Grid container spacing={2}>
        <ShiftOverviewDetail fullRow label='Category (Vehicle Category)' value={shift?.shiftCheckInOut?.equipmentDetails?.vehicleCategory?.name} tagColor="info" tag>
          {isAdminView && <RHFVehicleCategoriesSelect name="vehicleCategory" label=''/>}
        </ShiftOverviewDetail>
        <ShiftOverviewDetail label='Equipment' value={equipment} tagColor="info" tag />
        <ShiftOverviewDetail label='Starting Mileage' value={shift?.docusignEvent?.signerDetails?.[0]?.data?.startingMilage} tagVariant="outlined" tag />
        <ShiftOverviewDetail label='Ending Mileage' value={shift?.docusignEvent?.signerDetails?.[0]?.data?.endingMilage} tag />
      </Grid>
    </Stack>
  );
}
