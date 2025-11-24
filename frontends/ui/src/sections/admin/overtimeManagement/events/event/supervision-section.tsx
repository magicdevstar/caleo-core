// components
import { RHFSigningAuthorityAutocomplete, RHFUserAutocomplete } from "src/components/hook-form";
import { EditSection } from "src/sections/admin/overtimeManagement/events/common/section";
// types
import { Event } from 'src/__generated__/resolvers-types';

interface Props {
  disabled?: boolean;
  currentEvent?: Event;
}

export const EventSupervisionSection = ({
  disabled,
  currentEvent,
}: Props) => {
  return (
    <EditSection title="Supervisors" description="Set supervisors">
      <RHFUserAutocomplete
        name="overrideSupervisor"
        label="Outside Supervisor"
        disabled={disabled}
      />
      <RHFSigningAuthorityAutocomplete
        eventId={currentEvent?.id}
        name="supervisorAssignment"
        label='Pre-Approval Supervisor'
        disabled={disabled}
        helperText="Supervisor assignment that oversees the event and will be included on all shift documents"
      />
      <RHFSigningAuthorityAutocomplete
        eventId={currentEvent?.id}
        name="lieutenantAssignment"
        label='Signing Supervisor'
        disabled={disabled}
        helperText="Supervisor assignment that will sign off all shift confirmation documents."
      />
      <RHFSigningAuthorityAutocomplete
        eventId={currentEvent?.id}
        name="fieldSupervisorAssignment"
        label='Field Supervisor'
        disabled={disabled}
        helperText="Field Supervisor assignment."
      />
    </EditSection>
  );
}