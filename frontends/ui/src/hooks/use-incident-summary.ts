import { Dayjs } from "dayjs";
import { client } from 'src/utils/apollo';
import { useSnackbar } from "notistack";
import capitalize from "lodash/capitalize";
import { IncidentForm } from "src/__generated__/resolvers-types";
import { useAuthContext } from "src/auth/hooks";
import { usePNumberLabel } from "src/hooks/use-pNumber-label";
import { convertDate, useDateFormats } from "src/hooks/use-datejs";
import { useDownloadCsv } from "src/hooks/use-download-csv";
import { GET_INCIDENT_SUBMISSIONS_FOR_REPORT } from "src/api/incidentForm";

interface DownloadSummaryProps {
  event: { id: string; };
  user?: { id: string; };
  dateRange?: [Dayjs | null, Dayjs | null];
};

export const useIncidentSummary = () => {
  const { user } = useAuthContext();
  const { pNumberLabel } = usePNumberLabel();
  const { dateFormat, timeFormat } = useDateFormats();
  const { enqueueSnackbar } = useSnackbar();
  const { download } = useDownloadCsv({
    fileName: 'incident-reimbursement-report',
    ext: 'csv',
  });

  const downloadSummary = async (values: DownloadSummaryProps) => {
    try {
      const { data: res } = await client.query({
        query: GET_INCIDENT_SUBMISSIONS_FOR_REPORT,
        variables: {
          report: true,
          input: {
            eventId: values.event?.id,
            userId: values.user?.id,
            submittedDate: values.dateRange ? {
              gte: values.dateRange?.[0]?.toDate?.()?.toISOString?.(),
              lte: values.dateRange?.[1]?.toDate?.()?.toISOString?.(),
            } : undefined,
          },
        },
      });
      const items = (res.incidentForms?.items || []) as IncidentForm[];
      
      if (items.length === 0) {
        enqueueSnackbar('No data. Please try again.', {
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
  };

  return {
    downloadSummary
  };
};
