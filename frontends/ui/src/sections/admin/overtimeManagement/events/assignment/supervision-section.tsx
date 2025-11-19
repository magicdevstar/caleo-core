import Stack from "@mui/material/Stack";
import RHFSigningAuthorityAutocomplete from "src/components/hook-form/rhf-signing-authority-autocomplete";
import { Event } from 'src/__generated__/resolvers-types';
import { RHFSwitch } from "src/components/hook-form";
import { EditSection } from "../common/section";

interface IProps {
  eventId: string;
  disabled: boolean;
  event?: Event;
}

export const AssignmentSupervisionSection = ({
  eventId,
  disabled,
  event,
}: IProps) => (
  <EditSection title="Supervision" description="Supervisor definitions">
    <Stack direction="row" spacing={1.5} paddingBottom={1.5}>
      <Stack spacing={1} flex={1}>
        <RHFSigningAuthorityAutocomplete
          eventId={eventId}
          name="supervisorAssignment"
          label='Pre-Approval Supervisor'
          disabled={disabled}
          helperText="Incident commander assignment that oversees the event and will be included on all shift documents"
        />
        <RHFSwitch
          name="useSupervisorAssignmentOverride"
          label={<span>Outside Supervisor<br />{event?.overrideSupervisor ? `${event?.overrideSupervisor?.name} - ${event?.overrideSupervisor?.member?.rank?.name}` : '' }</span>}
          disabled={disabled}
        />
      </Stack>
      <Stack spacing={1} flex={1}>
        <RHFSigningAuthorityAutocomplete
          eventId={eventId}
          name="lieutenantAssignment"
          label='Signing Supervisor Override'
          disabled={disabled}
          helperText="Supervisor assignment that will sign off all shift confirmation documents."
        />
        <RHFSwitch
          name="useLieutenantAssignmentOverride"
          label={<span>Outside Supervisor<br />{event?.overrideSupervisor ? `${event?.overrideSupervisor?.name} - ${event?.overrideSupervisor?.member?.rank?.name}` : '' }</span>}
          disabled={disabled}
        />
      </Stack>
      <Stack spacing={1} flex={1}>
        <RHFSigningAuthorityAutocomplete
          eventId={eventId}
          name="fieldSupervisorAssignment"
          label='Field Supervisor'
          disabled={disabled}
          helperText="Field Supervisor assignment."
        />
        <RHFSwitch
          name="useFieldSupervisorAssignmentOverride"
          label={<span>Outside Supervisor<br />{event?.overrideSupervisor ? `${event?.overrideSupervisor?.name} - ${event?.overrideSupervisor?.member?.rank?.name}` : '' }</span>}
          disabled={disabled}
        />
      </Stack>
    </Stack>
  </EditSection>
);
