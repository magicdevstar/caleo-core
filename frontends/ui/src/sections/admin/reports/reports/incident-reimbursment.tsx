import { client } from 'src/utils/apollo';
import capitalize from 'lodash/capitalize';
import { useSnackbar } from 'notistack';
import { useForm } from 'react-hook-form';
import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
// @mui
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import LoadingButton from '@mui/lab/LoadingButton';
// Types
import { EventStatus, IncidentForm, MemberStatus } from 'src/__generated__/resolvers-types';
// hooks
import { useAuthContext } from 'src/auth/hooks';
// components
import FormProvider, { RHFDateRangePicker, RHFGQLSearchAutocomplete } from 'src/components/hook-form';
import { GET_ALL_EVENTS_SLIM } from 'src/api/event';
import { useDownloadCsv } from 'src/hooks/use-download-csv';
import { convertDate, useDateFormats } from 'src/hooks/use-datejs';
import { GET_USERS_SLIM } from 'src/api/user';
import { GET_INCIDENT_SUBMISSIONS_FOR_REPORT } from 'src/api/incidentForm';
import { usePNumberLabel } from 'src/hooks/use-pNumber-label';

const schema = Yup.object().shape({
  event: Yup.object().required('You must select an incident'),
  dateRange: Yup.array().nullable(),
  user: Yup.object().nullable(),
});

const defaultValues = {
  dateRange: [null, null],
  event: null,
  user: null,
} as any;

export function IncidentReimbursementReport() {
  const { user } = useAuthContext();
  const { pNumberLabel } = usePNumberLabel();
  const { dateFormat, timeFormat } = useDateFormats();
  const { enqueueSnackbar } = useSnackbar();
  const { download } = useDownloadCsv({
    fileName: 'incident-reimbursement-report',
    ext: 'csv',
  });

  const methods = useForm({
    mode: 'onTouched',
    resolver: yupResolver(schema),
    defaultValues,
  });
  
  const onSubmit = methods.handleSubmit(async (values) => {
    try {
      const { data: res } = await client.query({
        query: GET_INCIDENT_SUBMISSIONS_FOR_REPORT,
        variables: {
          input: {
            eventId: values.event?.id,
            userId: values.user?.id,
            submittedDate: {
              gte: values.dateRange[0]?.toDate()?.toISOString(),
              lte: values.dateRange[1]?.toDate()?.toISOString(),
            },
          },
        },
      });
      const items = (res.incidentForms?.items || []) as IncidentForm[];
      
      if (items.length === 0) {
        enqueueSnackbar('No data. Please try a different set of filters.', {
          variant: 'info',
          autoHideDuration: 3000,
        });
        return;
      }

      const formattedJson = items.map((incidentForm: IncidentForm) => ({
        'Status': capitalize(incidentForm.docusignEvent?.status || incidentForm.status || 'DRAFT'),
        'Event Name': incidentForm.event?.name || '',
        'Event Reference ID': incidentForm.event?.referenceId || '',
        'OCN': incidentForm.event?.ocn || '',
        'Budget Activity Code': incidentForm.event?.budgetActivityCode || '',
        'Outside Org Code': incidentForm.event?.outsideOrgCode || '',
        'Overtime Reason Code': incidentForm.event?.overtimeReasonCode || '',
        'Officer Name': incidentForm.user?.name || '',
        [`Officer ${pNumberLabel}`]: incidentForm.user?.member?.pNumber || '',
        'Reviewer': incidentForm.reviewerUser?.name || '',
        [`Reviewer ${pNumberLabel}`]: incidentForm.reviewerUser?.pNumber || '',
        'Operational Period Date': incidentForm.operationalPeriod?.date || '',
        'Submitted Date': convertDate({ date: incidentForm.submittedDate || incidentForm.updatedAt, user }).format(dateFormat),
        
        // Timekeeping
        'RDO': incidentForm.timekeeping?.rdo || '',
        'Timekeeping Type': incidentForm.timekeeping?.type || '',
        'Time In': incidentForm.timekeeping?.timeIn 
          ? convertDate({ date: incidentForm.timekeeping.timeIn, user }).format(timeFormat)
          : '',
        'Time Out': incidentForm.timekeeping?.timeOut 
          ? convertDate({ date: incidentForm.timekeeping.timeOut, user }).format(timeFormat)
          : '',
        'Overtime Time In': incidentForm.timekeeping?.overtimeTimeIn 
          ? convertDate({ date: incidentForm.timekeeping.overtimeTimeIn, user }).format(timeFormat)
          : '',
        'Overtime Time Out': incidentForm.timekeeping?.overtimeTimeOut 
          ? convertDate({ date: incidentForm.timekeeping.overtimeTimeOut, user }).format(timeFormat)
          : '',
        'Straight Hours': incidentForm.timekeeping?.straightHours || '',
        'Overtime Hours': incidentForm.timekeeping?.overtimeHours || '',
        
        // Shift Details
        'En Route to Incident': incidentForm.shiftDetails?.enrouteToIncident 
          ? convertDate({ date: incidentForm.shiftDetails.enrouteToIncident, user }).format(timeFormat)
          : '',
        'Staging 10-97': incidentForm.shiftDetails?.staging1097 
          ? convertDate({ date: incidentForm.shiftDetails.staging1097, user }).format(timeFormat)
          : '',
        'Staging 10-98': incidentForm.shiftDetails?.staging1098 
          ? convertDate({ date: incidentForm.shiftDetails.staging1098, user }).format(timeFormat)
          : '',
        'Arrival at UOA': incidentForm.shiftDetails?.arrivalAtUOA 
          ? convertDate({ date: incidentForm.shiftDetails.arrivalAtUOA, user }).format(timeFormat)
          : '',
        '18 Hour Time': incidentForm.shiftDetails?.time18Hour 
          ? convertDate({ date: incidentForm.shiftDetails.time18Hour, user }).format(timeFormat)
          : '',
        
        // Vehicle Information
        'Has Vehicle': incidentForm.vehicleInformation?.hasVehicle || '',
        'Vehicle Category': incidentForm.vehicleInformation?.vehicleCategory || '',
        'Vehicle Make': incidentForm.vehicleInformation?.vehicleMake || '',
        'Vehicle Model': incidentForm.vehicleInformation?.vehicleModel || '',
        'Vehicle Number': incidentForm.vehicleInformation?.vehicleNumber || '',
        'Starting Mileage': incidentForm.vehicleInformation?.startingMileage || '',
        'Ending Mileage': incidentForm.vehicleInformation?.endingMileage || '',
        
        // Assignment Summary
        'Call Sign': incidentForm.assignmentSummary?.callSign || '',
        'Squad': incidentForm.assignmentSummary?.squad || '',
        'Supervisor': incidentForm.assignmentSummary?.supervisor || '',
        'Other Explanation': incidentForm.assignmentSummary?.otherExplanation || '',
        
        // Mission Assignments
        'Escort': incidentForm.assignmentSummary?.missionAssignments?.escort ? 'Yes' : 'No',
        'Evacuations': incidentForm.assignmentSummary?.missionAssignments?.evacuations ? 'Yes' : 'No',
        'Hard Closure': incidentForm.assignmentSummary?.missionAssignments?.hardClosure ? 'Yes' : 'No',
        'Incident Management Team': incidentForm.assignmentSummary?.missionAssignments?.incidentManagementTeam ? 'Yes' : 'No',
        'Logistics': incidentForm.assignmentSummary?.missionAssignments?.logistics ? 'Yes' : 'No',
        'RRF': incidentForm.assignmentSummary?.missionAssignments?.rrf ? 'Yes' : 'No',
        'Roving Security': incidentForm.assignmentSummary?.missionAssignments?.rovingSecurity ? 'Yes' : 'No',
        'Search and Rescue': incidentForm.assignmentSummary?.missionAssignments?.searchAndRescue ? 'Yes' : 'No',
        'Soft Closure': incidentForm.assignmentSummary?.missionAssignments?.softClosure ? 'Yes' : 'No',
        'Welfare Check': incidentForm.assignmentSummary?.missionAssignments?.welfareCheck ? 'Yes' : 'No',
        'Other Assignment': incidentForm.assignmentSummary?.missionAssignments?.other ? 'Yes' : 'No',
        
        // Activity Log Summary
        'Activity Log Entry Count': incidentForm.activityLog?.entries?.length || 0,
        'Activity Log Entries': incidentForm.activityLog?.entries?.map((entry, index) => 
          `Entry ${index + 1}: Time: ${entry?.time ? convertDate({ date: entry.time, user }).format(dateFormat) : 'N/A'}, Mission: ${entry?.missionNumber || 'N/A'}, Notes: ${entry?.notes || 'N/A'}`
        ).join(' | ') || '',
        
        // DocuSign Information
        'Envelope ID': incidentForm.docusignEvent?.envelopeId || '',
        'DocuSign Status': incidentForm.docusignEvent?.status || '',
      }));
      
      download(formattedJson);
    } catch (error) {
      enqueueSnackbar('Error creating report', { variant: 'error', autoHideDuration: 3000 });
      console.error(error);
    }
  });

  return (
    <Card
      sx={{
        p: 3,
      }}
    >
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Search Criteria
        </Typography>
        <Box
          display="grid"
          rowGap={3}
          columnGap={2}
          sx={{
            mb: 4,
          }}
          gridTemplateColumns={{
            sm: 'repeat(1, 1fr)',
            lg: '1fr 33.3% 33.3%',
          }}
        >
          <RHFGQLSearchAutocomplete
            name="event"
            label="Incident *"
            query={GET_ALL_EVENTS_SLIM}
            responseKey='events'
            filters={{
              status: EventStatus.Incident,
            }}
          />

          <RHFDateRangePicker
            sx={{ width: '100%' }}
            name="dateRange"
            label="Date Range"
            calendars={1}
            timezone={user?.member?.org?.timezone}
          />

          <RHFGQLSearchAutocomplete
            name="user"
            label="Officer"
            query={GET_USERS_SLIM}
            responseKey='users'
            filters={{
              statuses: [MemberStatus.Active],
            }}
          />
        </Box>
        <Stack spacing={3} alignItems="flex-end" sx={{ mt: 3 }}>
          <LoadingButton type="submit" variant="contained" loading={methods.formState.isSubmitting}>
            Create Report
          </LoadingButton>
        </Stack>
      </FormProvider>
    </Card>
  );
};
