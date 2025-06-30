import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import { useFormContext, useWatch } from 'react-hook-form';
import { RHFVehicleCategoriesSelect } from 'src/components/hook-form/rhf-vehicle-categories-select';
import { RHFRadioGroup, RHFTextField } from '../../../components/hook-form';
import { TotalBox } from './total-box';

export default function VehicleInformationStep() {
  const { control } = useFormContext();
  
  // Watch for has vehicle value to show/hide fields
  const hasVehicle = useWatch({ name: 'vehicleInformation.hasVehicle', control });
  
  // Watch for starting and ending mileage to calculate total
  const startingMileage = useWatch({ name: 'vehicleInformation.startingMileage', control });
  const endingMileage = useWatch({ name: 'vehicleInformation.endingMileage', control });
  
  // Calculate total mileage when both values are present
  const totalMileage = 
    hasVehicle === 'yes' && 
    typeof startingMileage === 'number' && 
    typeof endingMileage === 'number' 
      ? Math.max(0, endingMileage - startingMileage) 
      : 0;
  
  return (
    <Stack spacing={3}>
      <RHFRadioGroup
        name="vehicleInformation.hasVehicle"
        label="Did you drive a vehicle?"
        options={[
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
        ]}
        row
      />
      
      {hasVehicle === 'yes' && (
        <>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={12} md={4}>
              <RHFVehicleCategoriesSelect
                name="vehicleInformation.vehicleCategory"
                label="Vehicle Category"
              />
            </Grid>
            <Grid item xs={12} sm={12} md={4}>
              <RHFTextField
                name="vehicleInformation.vehicleMake"
                label="Vehicle Make"
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={12} md={4}>
              <RHFTextField
                name="vehicleInformation.vehicleModel"
                label="Vehicle Model"
                fullWidth
              />
            </Grid>
          </Grid>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={12} md={4}>
              <RHFTextField
                name="vehicleInformation.vehicleNumber"
                label="Vehicle Number"
                fullWidth
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
            <Grid item xs={12} sm={12} md={4}>
              <RHFTextField
                name="vehicleInformation.startingMileage"
                label="Starting Mileage"
                type="number"
                fullWidth
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
            <Grid item xs={12} sm={12} md={4}>
              <RHFTextField
                name="vehicleInformation.endingMileage"
                label="Ending Mileage"
                type="number"
                fullWidth
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
          </Grid>
          
          <TotalBox mt={2} label="Total Milage" total={totalMileage} />
        </>
      )}
    </Stack>
  );
}
