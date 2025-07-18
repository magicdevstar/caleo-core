import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { Link } from 'react-router-dom';
import * as yup from 'yup';
// @mui
import LoadingButton from '@mui/lab/LoadingButton';
// components
import { ConfirmDialog } from 'src/components/custom-dialog';
// routes
import { paths } from 'src/routes/paths';
import { REQUIRED_EVENT_FIELDS } from 'src/api/event';
import { useFeatures } from 'src/hooks/use-features';

export interface KioskOpenDialogProps {
  /** 
   * `useBoolean()` hook result 
   *  - value: boolean 
   *  - onFalse: () => void 
   */
  kioskConfirm: {
    value: boolean;
    onFalse: () => void;
  };
  eventId: string;
}

export default function KioskOpenDialog({
  kioskConfirm,
  eventId,
}: KioskOpenDialogProps) {
  const { lasdEventFields } = useFeatures();
  const { data, loading } = useQuery(REQUIRED_EVENT_FIELDS, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      id: eventId,
    },
    skip: !eventId,
  });
  const event = data?.event;

  // Define the yup schema for validation
  const eventValidationSchema = yup.object().shape({
    ocn: lasdEventFields ? yup.string().required() : yup.string().nullable(),
    outsideOrgCode: lasdEventFields ? yup.string().required() : yup.string().nullable(),
    overtimeReasonCode: lasdEventFields ? yup.string().required() : yup.string().nullable(),
    budgetActivityCode: lasdEventFields ? yup.string().required() : yup.string().nullable(),
    supervisorAssignment: lasdEventFields ? yup.object().shape({
      shifts: yup.array().of(
        yup.object().shape({
          user: yup.object().required(),
        })
      ).min(1, 'At least one shift with a user is required'),
    }).required() : yup.object().nullable(),
    lieutenantAssignment: lasdEventFields ? yup.object().shape({
      shifts: yup.array().of(
        yup.object().shape({
          user: yup.object().required(),
        })
      ).min(1, 'At least one shift with a user is required'),
    }).required() : yup.object().nullable(),
    fieldSupervisorAssignment: lasdEventFields ? yup.object().shape({
      shifts: yup.array().of(
        yup.object().shape({
          user: yup.object().required(),
        })
      ).min(1, 'At least one shift with a user is required'),
    }).required() : yup.object().nullable(),
    venue: yup.object().shape({
      name: yup.string().required(),
    }),
  });

  // Validate the event object
  const isEventValid = loading ? true : eventValidationSchema.isValidSync(event);

  // Helper function to determine missing fields
  const getValidationErrors = () => {
    try {
      eventValidationSchema.validateSync(event, { abortEarly: false });
      return [];
    } catch (validationError) {
      return validationError.inner.map((err: any) => err.path);
    }
  };

  const validationErrors = getValidationErrors();

  const buttonDetails = useMemo(() => {
    if (isEventValid) {
      return {
        link: paths.kiosk.root.replace(':eventId', eventId),
        text: 'Open Check In Kiosk',
        color: 'error',
      };
    }
    return {
      link: paths.dashboard.admin.overtime.eventDetail.replace(':eventId', eventId),
      text: 'Edit Event',
      color: 'primary',
    };
  }, [isEventValid, eventId]);

  return (
    <ConfirmDialog
      open={kioskConfirm.value}
      onClose={kioskConfirm.onFalse}
      title={isEventValid ? "Are you sure you want to open the check-in kiosk?" : "Cannot open kiosk"}
      content={
        isEventValid
          ? "If you open the kiosk view you will not be able to open the event dashboard until you close the kiosk view and log back in."
          : `The kiosk cannot be opened because the following fields are missing or invalid: ${validationErrors.join(
              ', '
            )}. Please visit the event page to correct the fields.`
      }
      action={
        <LoadingButton
          variant="contained"
          loading={loading}
          color={buttonDetails.color as any}
          component={Link}
          onClick={kioskConfirm.onFalse}
          to={buttonDetails.link}
          sx={{ marginRight: 2 }}
        >
          {buttonDetails.text}
        </LoadingButton>
      }
    />
  );
}
