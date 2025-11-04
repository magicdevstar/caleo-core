import { EventUserActionsResponse, ShiftActivity } from "../groupedByEvent/shift-activitiy-dialog";

interface Props {
  activityData?: EventUserActionsResponse;
}

export default function ShiftOverviewActivity({ activityData }: Props) {
  return (
    <ShiftActivity items={activityData?.eventUserActions?.items || []} />
  )
}
