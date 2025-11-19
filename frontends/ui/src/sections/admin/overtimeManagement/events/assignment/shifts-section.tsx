import { RHFAssignmentShiftSlots } from "src/components/hook-form";
import { Assignment } from "src/__generated__/resolvers-types";
import { useFormContext } from "react-hook-form";
import { EditSection } from "../common/section";
import AssignmentShiftsTable from "../assignment-shifts-table";

interface Props {
  assignmentTemplateView: boolean;
  isSigningAuthority?: boolean;
  disabled?: boolean;
  isComplete?: boolean;
  eventId: string;
  currentAssignment?: Assignment;
  loading?: boolean;
  formSubmit: any;
}

export const AssignmentShiftSection = ({
  assignmentTemplateView,
  isSigningAuthority,
  disabled,
  isComplete,
  eventId,
  currentAssignment,
  loading,
  formSubmit,
}: Props) => {
  const title = assignmentTemplateView ? 'Shift Slots' : 'Shifts';
  const description = assignmentTemplateView ?
    'Define shift slot templates for this assignment' :
    'All shifts for this assignment';

  const { formState: { isValid }, getValues } = useFormContext();
  return (
    <EditSection title={title} description={description} customCard>
      {assignmentTemplateView ? (
        <RHFAssignmentShiftSlots
          name="shiftSlots"
          isSupervisorAssignment={!!isSigningAuthority}
          allDisabled={!!disabled}
          isComplete={!!isComplete}
        />
      ) : (
        <AssignmentShiftsTable 
          eventId={eventId}
          isSigningAuthority={!!isSigningAuthority}
          currentAssignment={currentAssignment}
          allDisabled={!!disabled}
          isComplete={!!isComplete}
          isValid={isValid}
          upsertAssignmentLoading={!!loading}
          createAssignmentWithValues={(values) => formSubmit(values, { reroute: 'assignment' })}
          getFormValues={getValues}
        />
      )}
    </EditSection>
  );
}
