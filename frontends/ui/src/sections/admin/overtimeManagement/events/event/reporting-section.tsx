import { EditReportingLocation } from "src/components/events/reporting-location/edit-reporting-location";
import { EditSection } from "src/sections/admin/overtimeManagement/events/common/section";

export const EventReportingSection = () => {
  return (
    <EditSection title="Reporting" description="Check in details, reporting location, etc.">
      <EditReportingLocation />
    </EditSection>
  );
}