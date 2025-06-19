import { useWatch } from 'react-hook-form';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import { RHFTextField, RHFCheckbox } from '../../../components/hook-form';

// Mission assignment options
const MISSION_ASSIGNMENTS = [
  { label: 'Escort', value: 'escort' },
  { label: 'Evacuations', value: 'evacuations' },
  { label: 'Hard Closure', value: 'hardClosure' },
  { label: 'Incident Management Team', value: 'incidentManagementTeam' },
  { label: 'Logistics', value: 'logistics' },
  { label: 'RRF', value: 'rrf' },
  { label: 'Roving Security', value: 'rovingSecurity' },
  { label: 'Search & Rescue', value: 'searchAndRescue' },
  { label: 'Soft Closure', value: 'softClosure' },
  { label: 'Welfare Check', value: 'welfareCheck' },
  { label: 'Other', value: 'other' },
];

export default function AssignmentSummaryStep() {
  const otherSelected = useWatch({ name: 'assignmentSummary.missionAssignments.other' });
  return (
    <Stack spacing={3}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <RHFTextField
            name="assignmentSummary.callSign"
            label="Call Sign"
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <RHFTextField
            name="assignmentSummary.squad"
            label="Squad"
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <RHFTextField
            name="assignmentSummary.supervisor"
            label="Supervisor"
            fullWidth
          />
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Mission Assignment
        </Typography>
        
        <Grid container>
          {MISSION_ASSIGNMENTS.map((option) => (
            <Grid item xs={12} sm={6} md={4} key={option.value}>
              <RHFCheckbox
                name={`assignmentSummary.missionAssignments.${option.value}`}
                label={option.label}
              />
            </Grid>
          ))}
        </Grid>
        {otherSelected && (
          <Box sx={{ mt: 2 }}>
            <RHFTextField
              name="assignmentSummary.otherExplanation"
              label="Please provide details for Other"
              fullWidth
            />
          </Box>
        )}
      </Box>
    </Stack>
  );
}
