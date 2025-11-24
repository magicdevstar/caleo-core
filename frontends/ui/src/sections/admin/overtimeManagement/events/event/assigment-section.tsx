import { useFormContext } from "react-hook-form";
// components
import { EditSection } from "src/sections/admin/overtimeManagement/events/common/section";
import EventAssignmentsTable from "src/sections/admin/overtimeManagement/events/event-assignments-table";
// types
import { paths } from "src/routes/paths";
import { Event } from 'src/__generated__/resolvers-types';
import { NewEventSchema } from "./schema";

interface Props {
  disabled?: boolean;
  eventTemplateView?: boolean;
  currentEvent?: Event;
  isValid: boolean;
  upsertEventLoading: boolean;
  formSubmit?: any;
}

export const EventAssignmentSection = ({
  disabled,
  currentEvent,
  eventTemplateView,
  formSubmit,
  upsertEventLoading,
  isValid,
}: Props) => {
  const basePath = eventTemplateView ? paths.dashboard.admin.overtime.templates : paths.dashboard.admin.overtime;
  const { getValues, trigger } = useFormContext();
  return (
    <EditSection title="Assignments" description="All assignments for this event" customCard>
      <EventAssignmentsTable
        currentEvent={currentEvent}
        eventTemplateView={eventTemplateView}
        basePath={basePath}
        allDisabled={!!disabled}
        isComplete={!!disabled}
        isValid={isValid}
        onSaveEvent={async (shouldReroute = false) => {
          const validated = await trigger();
          if (validated) {
            const formattedValues = NewEventSchema.cast(getValues());
            return formSubmit(formattedValues, shouldReroute);
          }
          return '';
        }}
        upsertEventLoading={upsertEventLoading}
      />
    </EditSection>
  );
}