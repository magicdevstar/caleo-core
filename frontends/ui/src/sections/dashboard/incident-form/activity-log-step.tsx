import { useFormContext, useFieldArray } from 'react-hook-form';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import Iconify from 'src/components/iconify';
import { RHFTextField, RHFTimePicker } from '../../../components/hook-form';

export default function ActivityLogStep() {
  const { control, getValues } = useFormContext();
  const isMutualAid = !!getValues('isMutualAid');
  
  // Use fieldArray to manage the array of activity log entries
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'activityLog.entries',
  });
  
  // Get the number of entries from the form state
  const entriesLength = fields.length;
  
  // Function to add a new entry
  const handleAddEntry = () => {
    if (entriesLength < 25) {
      append({
        time: null,
        missionNumber: '',
        notes: '',
      });
    }
  };
  
  // Function to remove an entry
  const handleRemoveEntry = (index: number) => {
    if (entriesLength > 1) {
      remove(index);
    }
  };
  
  return (
    <Stack spacing={3}>
      {isMutualAid && (
        <Alert severity="info">
          When completing your overtime form, please provide detailed information about your Mutual Aid deployment. Include the following:<br />
          <ul>
            <li><strong>Duration of Deployment:</strong> If deployed only part of the shift, specify hours (e.g., 1400–1800 hrs).</li>
            <li><strong>Agency Assisted:</strong> List the agency supported (e.g., LAPD, CAL FIRE, CHP).</li>
            <li><strong>Duties Executed:</strong> Describe tasks performed (e.g., traffic control, evacuation support, roving security, civil disobedience).</li>
          </ul>
          This information is required to validate reimbursement and ensure accurate documentation for FEMA and partner agencies.
        </Alert>
      )}

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Activity Log</Typography>
        
        <Button
          variant="contained"
          startIcon={<Iconify icon="ic:baseline-add" />}
          onClick={handleAddEntry}
          disabled={entriesLength >= 25}
          size="small"
        >
          Add Entry
        </Button>
      </Stack>
      
      {entriesLength === 0 && (
        <Alert severity="info" sx={{ my: 2 }}>
          No entries added yet. Click &quot;Add Entry&quot; to create one.
        </Alert>
      )}
      
      {fields.map((field, index) => (
        <Box key={field.id} sx={{ mb: 3 }}>
          <Box sx={{ mb: 2 }}>
            <Divider>
              <Typography variant="subtitle2" color="text.secondary">
                Activity Entry {index + 1}
              </Typography>
            </Divider>
          </Box>
          
          <Stack direction="row" spacing={1} alignItems="flex-start">
            <Box flexGrow={1}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Stack spacing={1}>
                    <RHFTimePicker
                      name={`activityLog.entries.${index}.time`}
                      label="Time"
                      textFieldProps={{ fullWidth: true }}
                      format="HH:mm"
                      ampm={false}
                    />
                    <RHFTextField
                      name={`activityLog.entries.${index}.missionNumber`}
                      label="Mission Number"
                      fullWidth
                    />
                  </Stack>
                </Grid>
                <Grid item xs={12} md={8}>
                  <RHFTextField
                    name={`activityLog.entries.${index}.notes`}
                    label="Notes"
                    multiline
                    rows={4}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Box>
            
            {fields.length > 1 && (
              <IconButton
                color="error"
                onClick={() => handleRemoveEntry(index)}
                sx={{ mt: 1 }}
                disabled={entriesLength <= 1}
              >
                <Iconify icon="solar:trash-bin-trash-bold-duotone" />
              </IconButton>
            )}
          </Stack>
        </Box>
      ))}
      
      {entriesLength > 0 && entriesLength < 25 && (
        <Button
          variant="outlined"
          startIcon={<Iconify icon="ic:baseline-add" />}
          onClick={handleAddEntry}
          fullWidth
          sx={{ mt: 2 }}
        >
          Add Another Entry
        </Button>
      )}
      
      {entriesLength >= 25 && (
        <Typography color="warning.main" align="center">
          Maximum number of entries reached (25)
        </Typography>
      )}
    </Stack>
  );
}
