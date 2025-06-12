import { useState } from 'react';
import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

// @mui
import Box from '@mui/material/Box';
import Step from '@mui/material/Step';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Stepper from '@mui/material/Stepper';
import StepLabel from '@mui/material/StepLabel';
import Typography from '@mui/material/Typography';
import StepContent from '@mui/material/StepContent';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';

// icons
// import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// types
import { Event } from 'src/__generated__/resolvers-types';

// components
import FormProvider from 'src/components/hook-form';
import Iconify from 'src/components/iconify';
import { reader } from 'src/layouts/_common/notifications-popover/notification-item';

// sections
import OperationalPeriodStep from './operational-period-step';
import TimekeepingStep from './timekeeping-step';
import ShiftDetailsStep from './shift-details-step';
import VehicleInformationStep from './vehicle-information-step';
import AssignmentSummaryStep from './assignment-summary-step';
import ActivityLogStep from './activity-log-step';
import SelectReviewerStep from './select-reviewer-step';

// ----------------------------------------------------------------------

const STEPS = ['Operational Period', 'Timekeeping', 'Shift Details', 'Vehicle Information', 'Assignment Summary', 'Activity Log', 'Select Reviewer'];

// ----------------------------------------------------------------------

const IncidentFormSchema = Yup.object().shape({
  operationalPeriod: Yup.object().shape({
    date: Yup.date().required('Date is required'),
  }),
  reviewer: Yup.string().required('Reviewer is required'),
  timekeeping: Yup.object().shape({
    rdo: Yup.string().required('RDO selection is required'),
    overtimeHours: Yup.number().when('rdo', {
      is: 'yes',
      then: (schema) => schema.required('Overtime Hours is required').min(0, 'Must be positive'),
      otherwise: (schema) => schema.nullable(),
    }),
    straightHours: Yup.number().when('rdo', {
      is: 'no',
      then: (schema) => schema.required('Straight Hours is required').min(0, 'Must be positive'),
      otherwise: (schema) => schema.nullable(),
    }),
    timeIn: Yup.date().nullable().required('Time In is required'),
    timeOut: Yup.date().nullable().required('Time Out is required'),
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
    squad: Yup.string().required('Squad is required'),
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
  }),
  activityLog: Yup.object().shape({
    entries: Yup.array()
      .of(
        Yup.object().shape({
          time: Yup.date().nullable().required('Time is required'),
          missionNumber: Yup.string().required('Mission number is required'),
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
    overtimeHours: 0,
    straightHours: 0,
    timeIn: null as any,
    timeOut: null as any,
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
  const [activeStep, setActiveStep] = useState(0);

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
      console.log('DATA', data);
      // Submit form data to your API
    } catch (error) {
      console.error(error);
    }
  };

  const handleNext = async () => {
    let stepFields: any[] = [];
    
    if (activeStep === 0) {
      // Validate operational period fields
      stepFields = ['operationalPeriod.date'];
    } else if (activeStep === 1) {
      // Validate timekeeping fields based on RDO selection
      const rdoValue = getValues('timekeeping.rdo');
      stepFields = ['timekeeping.rdo', 'timekeeping.timeIn', 'timekeeping.timeOut'];
      
      if (rdoValue === 'yes') {
        stepFields.push('timekeeping.overtimeHours');
      } else if (rdoValue === 'no') {
        stepFields.push('timekeeping.straightHours');
      }
    } else if (activeStep === 2) {
      // Shift details are all optional, so we can proceed without validation
      // But we could validate formats if needed in the future
    } else if (activeStep === 3) {
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
    } else if (activeStep === 4) {
      // Validate assignment summary fields
      stepFields = [
        'assignmentSummary.callSign',
        'assignmentSummary.squad',
        'assignmentSummary.supervisor',
        'assignmentSummary.missionAssignments'
      ];
    } else if (activeStep === 5) {
      // Activity log validation is handled by the schema (array min/max validation)
      stepFields = ['activityLog.entries'];
    } else if (activeStep === 6) {
      // Validate reviewer selection
      stepFields = ['reviewer'];
    }
    
    const isStepValid = await trigger(stepFields);
    
    if (isStepValid) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
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
        
        <Stepper activeStep={activeStep} orientation="vertical">
          {STEPS.map((label, index) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
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
                  
                  <Button
                    variant="contained"
                    onClick={activeStep === STEPS.length - 1 ? handleSubmit(onSubmit) : handleNext}
                  >
                    {activeStep === STEPS.length - 1 ? 'Finish' : 'Continue'}
                  </Button>
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
        
        {activeStep === STEPS.length && (
          <Paper square elevation={0} sx={{ p: 3 }}>
            <Typography>All steps completed - you&apos;re finished</Typography>
            <Button onClick={handleReset} sx={{ mt: 1, mr: 1 }}>
              Reset
            </Button>
          </Paper>
        )}
      </Paper>
    </FormProvider>
  );
}
