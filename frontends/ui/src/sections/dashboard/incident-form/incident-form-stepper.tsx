import { useState } from 'react';
import omitDeep from 'omit-deep';
import { useMutation } from '@apollo/client';
import { useSnackbar } from 'notistack';
import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

// @mui
import Box from '@mui/material/Box';
import Step from '@mui/material/Step';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Stepper from '@mui/material/Stepper';
import StepButton from '@mui/material/StepButton';
import Typography from '@mui/material/Typography';
import StepContent from '@mui/material/StepContent';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import LoadingButton from '@mui/lab/LoadingButton';

// icons
// import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// types
import { Event } from 'src/__generated__/resolvers-types';
import { UPSERT_INCIDENT_SUBMISSION, GET_INCIDENT_SUBMISSIONS } from 'src/api/incidentForm';

// components
import FormProvider from 'src/components/hook-form';
import Iconify from 'src/components/iconify';
import { reader } from 'src/layouts/_common/notifications-popover/notification-item';

// sections
import OperationalPeriodStep from './operational-period-step';
import TimekeepingStep, { getEarliestTime, TimekeepingType } from './timekeeping-step';
import ShiftDetailsStep from './shift-details-step';
import VehicleInformationStep from './vehicle-information-step';
import AssignmentSummaryStep from './assignment-summary-step';
import ActivityLogStep from './activity-log-step';
import SelectReviewerStep from './select-reviewer-step';
import Submissions from './submissions';

// ----------------------------------------------------------------------

const STEPS = ['Operational Period', 'Timekeeping', 'Shift Details', 'Vehicle Information', 'Assignment Summary', 'Activity Log', 'Select Reviewer'];

// ----------------------------------------------------------------------

const IncidentFormSchema = Yup.object().shape({
  id: Yup.string().nullable(),
  operationalPeriod: Yup.object().shape({
    date: Yup.date().required('Date is required'),
  }),
  reviewer: Yup.string().required('Reviewer is required'),
  timekeeping: Yup.object().shape({
    rdo: Yup.string().required('RDO selection is required'),
    type: Yup.string().required('Paid or Saved selection is required'),
    overtimeHours: Yup.number().min(0, 'Must be positive'),
    straightHours: Yup.number().min(0, 'Must be positive'),
    overtimeHoursDisplay: Yup.string().matches(/^\d+:\d{2}$/, 'Must be in format H:MM'),
    straightHoursDisplay: Yup.string().matches(/^\d+:\d{2}$/, 'Must be in format H:MM'),
    timeIn: Yup.date().nullable().required('Time In is required'),
    timeOut: Yup.date().nullable().required('Time Out is required'),
    overtimeTimeIn: Yup.date().nullable(),
    overtimeTimeOut: Yup.date().nullable(),
    minTimeIn: Yup.date().nullable(),
  }),
  shiftDetails: Yup.object().shape({
    enrouteToIncident: Yup.date().nullable(),
    staging1097: Yup.date().nullable(),
    staging1098: Yup.date().nullable(),
    arrivalAtUOA: Yup.date().nullable(),
    time18Hour: Yup.date().nullable(),
  }),
  vehicleInformation: Yup.object().shape({
    hasVehicle: Yup.string().required('This selection is required'),
    vehicleCategory: Yup.string().when('hasVehicle', {
      is: 'yes',
      then: (schema) => schema.required('Vehicle Category is required'),
    }),
    vehicleMake: Yup.string().when('hasVehicle', {
      is: 'yes',
      then: (schema) => schema.required('Vehicle Make is required'),
    }),
    vehicleModel: Yup.string().when('hasVehicle', {
      is: 'yes',
      then: (schema) => schema.required('Vehicle Model is required'),
    }),
    vehicleNumber: Yup.string().when('hasVehicle', {
      is: 'yes',
      then: (schema) => schema.required('Vehicle Number is required'),
    }),
    startingMileage: Yup.number().when('hasVehicle', {
      is: 'yes',
      then: (schema) => schema.required('Starting Mileage is required').min(0, 'Must be positive'),
    }),
    endingMileage: Yup.number().when('hasVehicle', {
      is: 'yes',
      then: (schema) => 
        schema.required('Ending Mileage is required')
          .min(0, 'Must be positive')
          .test(
            'is-greater-than-starting',
            'Ending mileage must be greater than starting mileage',
            function(value) { // eslint-disable-line func-names
              const { startingMileage } = this.parent;
              return !startingMileage || !value || value >= startingMileage;
            }
          ),
    }),
  }),
  assignmentSummary: Yup.object().shape({
    callSign: Yup.string().required('Call Sign is required'),
    squad: Yup.string().nullable(),
    supervisor: Yup.string().required('Supervisor is required'),
    missionAssignments: Yup.object().shape({
      escort: Yup.boolean(),
      evacuations: Yup.boolean(),
      hardClosure: Yup.boolean(),
      incidentManagementTeam: Yup.boolean(),
      logistics: Yup.boolean(),
      rrf: Yup.boolean(),
      rovingSecurity: Yup.boolean(),
      searchAndRescue: Yup.boolean(),
      softClosure: Yup.boolean(),
      welfareCheck: Yup.boolean(),
      other: Yup.boolean(),
    }).test(
      'at-least-one-selected',
      'At least one mission assignment must be selected',
      (value) => Object.values(value || {}).some(Boolean)
    ),
    otherExplanation: Yup.string().when('missionAssignments.other', {
      is: true,
      then: (schema) => schema.required('Please provide details for "Other" assignment'),
    }),
  }),
  activityLog: Yup.object().shape({
    entries: Yup.array()
      .of(
        Yup.object().shape({
          time: Yup.date().nullable().required('Time is required'),
          missionNumber: Yup.string(),
          notes: Yup.string().required('Notes are required'),
        })
      )
      .min(1, 'At least one activity log entry is required')
      .max(25, 'Maximum 25 activity log entries allowed')
      .required('At least one activity log entry is required'),
  }),
});
type IncidentFormSchemaType = Yup.Asserts<typeof IncidentFormSchema>;

const defaultValues: IncidentFormSchemaType = {
  operationalPeriod: {
    date: null as any,
  },
  reviewer: '',
  timekeeping: {
    rdo: '',
    type: TimekeepingType.PAID,
    overtimeHours: 0,
    straightHours: 0,
    overtimeHoursDisplay: '0:00',
    straightHoursDisplay: '0:00',
    timeIn: null as any,
    timeOut: null as any,
    overtimeTimeIn: null as any,
    overtimeTimeOut: null as any,
    minTimeIn: null as any,
  },
  shiftDetails: {
    enrouteToIncident: null as any,
    staging1097: null as any,
    staging1098: null as any,
    arrivalAtUOA: null as any,
    time18Hour: null as any,
  },
  vehicleInformation: {
    hasVehicle: '',
    vehicleCategory: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleNumber: '',
    startingMileage: 0,
    endingMileage: 0,
  },
  assignmentSummary: {
    callSign: '',
    squad: '',
    supervisor: '',
    missionAssignments: {
      escort: false,
      evacuations: false,
      hardClosure: false,
      incidentManagementTeam: false,
      logistics: false,
      rrf: false,
      rovingSecurity: false,
      searchAndRescue: false,
      softClosure: false,
      welfareCheck: false,
      other: false,
    },
  },
  activityLog: {
    entries: [
      {
        time: null as any,
        missionNumber: '',
        notes: '',
      },
    ],
  },
};

export default function IncidentFormStepper({
  event
}: { event: Event }) {
  const { enqueueSnackbar } = useSnackbar();
  const [submitIncidentForm, { loading }] = useMutation(UPSERT_INCIDENT_SUBMISSION, {
    refetchQueries: [
      {
        query: GET_INCIDENT_SUBMISSIONS,
        variables: { input: { eventId: event.id } },
      },
    ],
  });
  const [activeStep, setActiveStep] = useState(0);
  const [validationState, setValidationState] = useState<boolean[]>(
    Array(STEPS.length).fill(undefined)
  );

  const methods = useForm<IncidentFormSchemaType>({
    resolver: yupResolver(IncidentFormSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    getValues,
    trigger,
  } = methods;

  const onSubmit = async (data: IncidentFormSchemaType) => {
    try {
      // Remove display fields before submission, keeping only numeric values for backend
      const {
        // Display only
        minTimeIn, // eslint-disable-line @typescript-eslint/no-unused-vars
        // Remove display fields - backend only expects numeric values
        straightHoursDisplay, // eslint-disable-line @typescript-eslint/no-unused-vars
        overtimeHoursDisplay, // eslint-disable-line @typescript-eslint/no-unused-vars
        ...timekeeping
      } = data.timekeeping;
      const submitData = {
        ...data,
        timekeeping,
        vehicleInformation: {
          ...data.vehicleInformation,
          vehicleNumber: data.vehicleInformation.hasVehicle === 'yes' ? data.vehicleInformation.vehicleNumber : 'N/A',
        },
      };
      
      const res = await submitIncidentForm({
        variables: {
          input: omitDeep({
            ...submitData,
            step: activeStep,
            eventId: event.id,
          }, ['__typename', 'straightHoursDisplay', 'overtimeHoursDisplay']),
          saveOnly: false,
        },
      });
      enqueueSnackbar(
        'Incident form submitted successfully',
        { variant: 'success', autoHideDuration: 3000 }
      );
      if (res.data?.incidentForm?.signingUrl) {
        window.location.href = res.data.incidentForm.signingUrl;
      }
    } catch (error) {
      console.error(error);
      let message = 'Failed to submit incident form';
      if (error.message === 'An incident form already exists for this event and date') {
        message = 'A submission already exists for this date. Please review the operational period before continuing.';
      }
      enqueueSnackbar(
        message, 
        { variant: 'error', autoHideDuration: 3000 }
      );
    }
  };

  // Function to check if a specific step is valid
  const validateStep = async (step: number): Promise<boolean> => {
    let stepFields: any[] = [];
    
    if (step === 0) {
      // Validate operational period fields
      stepFields = ['operationalPeriod.date'];
    } else if (step === 1) {
      // Validate timekeeping fields based on RDO selection
      stepFields = ['timekeeping.rdo', 'timekeeping.timeIn', 'timekeeping.timeOut'];
    } else if (step === 2) {
      // Shift details are all optional, so we can proceed without validation
      return true;
    } else if (step === 3) {
      // Validate vehicle information fields
      stepFields = ['vehicleInformation.hasVehicle'];
      
      const hasVehicle = getValues('vehicleInformation.hasVehicle');
      
      if (hasVehicle === 'yes') {
        stepFields.push(
          'vehicleInformation.vehicleCategory',
          'vehicleInformation.vehicleMake',
          'vehicleInformation.vehicleModel',
          'vehicleInformation.vehicleNumber',
          'vehicleInformation.startingMileage',
          'vehicleInformation.endingMileage'
        );
      }
    } else if (step === 4) {
      // Validate assignment summary fields
      stepFields = [
        'assignmentSummary.callSign',
        'assignmentSummary.supervisor',
        'assignmentSummary.missionAssignments',
        'assignmentSummary.otherExplanation',
      ];
    } else if (step === 5) {
      // Activity log validation is handled by the schema (array min/max validation)
      stepFields = ['activityLog.entries'];
    } else if (step === 6) {
      // Validate reviewer selection
      stepFields = ['reviewer'];
    }
    
    return trigger(stepFields);
  };

  // Check all steps up to the current one when changing steps
  const updateValidationState = async (newStep: number) => {
    const newValidationState = [...validationState];
    
    for (let i = 0; i < newStep; i += 1) {
      newValidationState[i] = await validateStep(i); // eslint-disable-line no-await-in-loop
    }
    
    setValidationState(newValidationState);
  };

  const handleNext = async () => {
    const isStepValid = await validateStep(activeStep);
    
    // Update validation state for the current step
    const newValidationState = [...validationState];
    newValidationState[activeStep] = isStepValid;
    setValidationState(newValidationState);
    
    if (isStepValid) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleStepClick = (clickedStep: number) => {
    setActiveStep(clickedStep);
    // When clicking on a step, validate the current step
    updateValidationState(clickedStep);
  };

  const handleReset = () => {
    setActiveStep(0);
    setValidationState(Array(STEPS.length).fill(undefined));
  };

  // Handle selecting an in-progress submission
  const handleSelectSubmission = (submission: any) => {
    // Helper function to convert numeric hours to H:MM format
    const formatHours = (hours: number): string => {
      const h = Math.floor(hours);
      const m = Math.round((hours - h) * 60);
      return `${h}:${m.toString().padStart(2, '0')}`;
    };
    const times = [submission.timekeeping.timeIn, submission.timekeeping.overtimeTimeIn].filter(Boolean);

    // Reset form with the submission data, adding display fields
    methods.reset({
      id: submission.id,
      operationalPeriod: submission.operationalPeriod,
      reviewer: submission.reviewer,
      timekeeping: {
        ...submission.timekeeping,
        // Add display fields based on numeric values
        straightHoursDisplay: formatHours(submission.timekeeping.straightHours || 0),
        overtimeHoursDisplay: formatHours(submission.timekeeping.overtimeHours || 0),
        minTimeIn: getEarliestTime(times as Date[]),
      },
      shiftDetails: submission.shiftDetails,
      vehicleInformation: submission.vehicleInformation,
      assignmentSummary: submission.assignmentSummary,
      activityLog: submission.activityLog,
    });

    // Resume step
    setActiveStep(submission.step);
    
    // Set validation state based on submission data
    updateValidationState(submission.step);
    
    // Show notification
    enqueueSnackbar('Previous submission loaded', { 
      variant: 'success', 
      autoHideDuration: 3000 
    });
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return <OperationalPeriodStep />;
      case 1:
        return <TimekeepingStep />;
      case 2:
        return <ShiftDetailsStep />;
      case 3:
        return <VehicleInformationStep />;
      case 4:
        return <AssignmentSummaryStep />;
      case 5:
        return <ActivityLogStep />;
      case 6:
        return <SelectReviewerStep />;
      default:
        return null;
    }
  };

  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Paper sx={{ p: 3, width: '100%' }}>
        {event.notes ? (
          <Accordion defaultExpanded={false} sx={{ mb: 3, boxShadow: 'none', '&:before': { display: 'none' } }}>
            <AccordionSummary 
              expandIcon={<Iconify icon="mdi:chevron-down" />}
              sx={{ p: 0, '& .MuiAccordionSummary-content': { margin: 0 } }}
            >
              <Box>
                <Typography variant="h5">Incident: {event.name}</Typography>
                {event.ocn && <Typography variant="subtitle2" color="text.secondary">OCN: {event.ocn}</Typography>}
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0, pb: 2, px: 0 }}>
              {event.notes && reader(event.notes)}
            </AccordionDetails>
          </Accordion>
        ) : (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5">Incident: {event.name}</Typography>
            {event.ocn && <Typography variant="subtitle2" color="text.secondary">OCN: {event.ocn}</Typography>}
          </Box>
        )}
        
        <Submissions eventId={event.id} onSelectSubmission={handleSelectSubmission} />
        
        <Stepper activeStep={activeStep} orientation="vertical" nonLinear>
          {STEPS.map((label, index) => {
            const isInvalid = activeStep > index && validationState[index] === false;
            
            return (
              <Step key={label} completed={index < activeStep}>
                <StepButton 
                  onClick={() => handleStepClick(index)}
                  icon={
                    isInvalid ? (
                      <Iconify 
                        icon="mingcute:close-line" 
                        color="error.main"
                        width={24}
                        height={24}
                      />
                    ) : index + 1
                  }
                >
                  {label}
                </StepButton>
                <StepContent>
                  <Box sx={{ mt: 3, mb: 2 }}>
                    {renderStepContent(index)}
                  </Box>
                  
                  <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
                    <Button
                      disabled={activeStep === 0}
                      onClick={handleBack}
                    >
                      Back
                    </Button>
                    
                    <LoadingButton
                      loading={loading}
                      variant="contained"
                      onClick={activeStep === STEPS.length - 1 ? handleSubmit(onSubmit) : handleNext}
                    >
                      {activeStep === STEPS.length - 1 ? 'Finish' : 'Continue'}
                    </LoadingButton>
                  </Box>
                </StepContent>
              </Step>
            );
          })}
        </Stepper>
        
        {activeStep === STEPS.length && (
          <Paper square elevation={0} sx={{ p: 3 }}>
            <Typography>All steps completed - you&apos;re finished</Typography>
            <Button onClick={handleReset} sx={{ mt: 1, mr: 1 }}>
              Reset
            </Button>
          </Paper>
        )}
        
        <Box 
          sx={{ 
            mt: 3, 
            pt: 2, 
            display: 'flex', 
            justifyContent: 'flex-end',
            borderTop: '1px solid',
            borderColor: 'divider',
            position: 'sticky',
            bottom: 0,
            bgcolor: 'background.paper',
            zIndex: 1
          }}
        >
          <LoadingButton
            variant="outlined"
            onClick={() => {
              const data = getValues();
              // Remove display fields before submission, keeping only numeric values for backend
              const submitData = {
                ...data,
                timekeeping: {
                  ...data.timekeeping,
                  // Remove display fields - backend only expects numeric values
                  straightHoursDisplay: undefined,
                  overtimeHoursDisplay: undefined,
                  minTimeIn: undefined,
                },
                vehicleInformation: {
                  ...data.vehicleInformation,
                  vehicleNumber: data.vehicleInformation.hasVehicle === 'yes' ? data.vehicleInformation.vehicleNumber : 'N/A',
                }
              };
              
              submitIncidentForm({
                variables: {
                  input: omitDeep({
                    ...submitData,
                    step: activeStep,
                    eventId: event.id,
                  }, ['__typename', 'straightHoursDisplay', 'overtimeHoursDisplay', 'minTimeIn']),
                  saveOnly: true,
                },
              })
                .then(() => {
                  enqueueSnackbar('Form saved successfully', { 
                    variant: 'success', 
                    autoHideDuration: 3000 
                  });
                })
                .catch((error) => {
                  console.error(error);
                  enqueueSnackbar('Failed to save form', { 
                    variant: 'error', 
                    autoHideDuration: 3000 
                  });
                });
            }}
            loading={loading}
            disabled={validationState[0] !== true} // Disabled if Step 1 is not complete
            startIcon={<Iconify icon="mdi:content-save-outline" />}
          >
            Save Progress
          </LoadingButton>
        </Box>
      </Paper>
    </FormProvider>
  );
}
