import { useMemo } from 'react';
// @mui
import Stack from '@mui/material/Stack';
import Grid from "@mui/material/Grid";
// types
import { EventUserAction, EventUserActionLogAction, Shift } from 'src/__generated__/resolvers-types';
import { GET_USER_SHIFT_ACTIVITY } from 'src/api/user';
import { TableConfig } from 'src/components/table/table-config';
// hooks
import { convertDate, useDateFormats } from 'src/hooks/use-datejs';
import { useAuthContext } from 'src/auth/hooks';
import { useFeatures } from 'src/hooks/use-features';
import { RHFDateTimePicker, RHFSwitch, RHFTextField } from 'src/components/hook-form';
import { docusignStatusColor, docusignStatusLabel } from 'src/utils/docusign';
// components
import MapMarkersPopups from 'src/components/map/map-marker-popups';
import GQLTable from 'src/components/table/gql/table';
import ShiftOverviewDetail from './shift-overview-detail';
import { StyledMapContainer } from '../../map/styles';
import { EventUserActionsResponse } from '../groupedByEvent/shift-activitiy-dialog';

const baseSettings = {
  minZoom: 1,
};

interface Props {
  shift?: Shift;
  isAdminView?: boolean;
  activityData?: EventUserActionsResponse;
};

const timeSteps = { hours: 1, minutes: 15, seconds: 5 };

export default function ShiftOverviewTimeKeeping({ shift, activityData, isAdminView }: Props) {
  const { officerCheckInOut, lasdEventFields, eventCheckIn, eventCheckOut } = useFeatures();
  const { timeFormat } = useDateFormats();
  const { user } = useAuthContext();

  const docusignStatus = useMemo(() => ({
    label: docusignStatusLabel(shift?.docusignEvent?.status),
    color: docusignStatusColor(shift?.docusignEvent?.status),
  }), [shift]);

  const hasCoordinates = useMemo(() =>
    shift?.shiftCheckInOut?.checkInCoords || shift?.shiftCheckInOut?.checkOutCoords, [shift]);

  const checkInTime = useMemo(() => {
    if (!shift?.shiftCheckInOut?.checkInTime) {
      return null;
    }
    return convertDate({
      date: new Date(shift?.shiftCheckInOut?.checkInTime),
      user
    }).format(timeFormat);
  }, [shift, timeFormat, user])

  const hour18Time = useMemo(() => {
    if (!shift?.shiftCheckInOut?.checkInTime) {
      return null;
    }
    return convertDate({
      date: new Date(shift?.shiftCheckInOut?.checkInTime),
      user
    }).add(18, 'hour').format(timeFormat);
  }, [shift, timeFormat, user])

  const checkOutTime = useMemo(() => {
    if (!shift?.shiftCheckInOut?.checkOutTime) {
      return null;
    }
    return convertDate({
      date: new Date(shift?.shiftCheckInOut?.checkOutTime),
      user
    }).format(timeFormat);
  }, [shift, timeFormat, user])

  const commentTableConfig: TableConfig<EventUserAction> = useMemo(() => {
    const officerComments = activityData?.eventUserActions?.items.
    filter(action => action.action === EventUserActionLogAction.OfficerCommentAdded) || [];
    return {
      header: {
        title: 'Officer Comments',
        titleSx: { p: 0 },
        buttons: [],
      },
      table: {
        sx: {
          minWidth: 'inherit',
        }
      },
      search: {
        data: (officerComments || []),
        query: GET_USER_SHIFT_ACTIVITY,
        processResult: (data) => ({
          items: data,
          total: data.length,
        }),
      },
      rowActions: [],
      columns: [
        {
          id: 'timestamp',
          label: 'Date',
          columnType: 'date',
        },
        {
          id: 'notes',
          label: 'Comment',
          columnType: 'string',
        }
      ],
      filters: []
    }
  }, [activityData]);

  return (
    <Stack spacing={3}>
      <Grid container spacing={2}>
        <ShiftOverviewDetail label='Shift ID' value={shift?.customId}>
          {isAdminView && <RHFTextField name="customId" />}
        </ShiftOverviewDetail>
        {
          eventCheckIn && (
          <ShiftOverviewDetail label='Check-in' value={checkInTime} tagColor="info" tagVariant='filled' tag>
            {isAdminView && <RHFDateTimePicker timezone={user.member.org?.timezone} timeSteps={timeSteps} ampm={false} name="checkInTime" />}
          </ShiftOverviewDetail>
        )}
        {eventCheckOut && (
          <ShiftOverviewDetail label='Check-out' value={checkOutTime} tagColor="info" tagVariant='filled' tag>
            {isAdminView && <RHFDateTimePicker timezone={user.member.org?.timezone} timeSteps={timeSteps} ampm={false} name="checkOutTime" />}
          </ShiftOverviewDetail>
        )}
        {lasdEventFields && <ShiftOverviewDetail label='18 Hour Time' value={hour18Time} tagColor="warning" tagVariant='filled' tag />}
        <ShiftOverviewDetail label='No Show' value={shift?.shiftCheckInOut?.noShow ? 'Yes' : 'No'} tagColor={shift?.shiftCheckInOut?.noShow ? "error" : 'default'} tagVariant='outlined' tag>
          {isAdminView && <RHFSwitch name="noShow" label="" />}
        </ShiftOverviewDetail>
        <ShiftOverviewDetail label='Docusign Status' value={docusignStatus.label} tagColor={docusignStatus.color as any} tagVariant='filled' tag />
        {isAdminView && (
          <ShiftOverviewDetail label='Regenerate Docusign'>
            {isAdminView && <RHFSwitch name="regenerateDocusign" label="" disabled={!shift?.shiftCheckInOut?.checkInTime || !shift?.shiftCheckInOut?.checkOutTime} />}
          </ShiftOverviewDetail>
        )}
      </Grid>
      { hasCoordinates && officerCheckInOut && lasdEventFields &&
        <StyledMapContainer sx={{ mt: 2 }}>
          <MapMarkersPopups
            {...baseSettings}
            initialViewState={{
              zoom: 16,
              latitude: shift?.shiftCheckInOut?.checkInCoords?.latitude || shift?.shiftCheckInOut?.checkOutCoords?.latitude as any,
              longitude: shift?.shiftCheckInOut?.checkInCoords?.longitude || shift?.shiftCheckInOut?.checkOutCoords?.longitude as any,
            }}
            data={[
              ...(shift?.shiftCheckInOut?.checkInCoords?.latitude ? [{
                name: 'Check In',
                latitude: shift?.shiftCheckInOut?.checkInCoords?.latitude as any,
                longitude: shift?.shiftCheckInOut?.checkInCoords?.longitude as any,
              }] : []),
              ...(shift?.shiftCheckInOut?.checkOutCoords?.latitude ? [{
                name: 'Check Out',
                latitude: shift?.shiftCheckInOut?.checkOutCoords?.latitude as any,
                longitude: shift?.shiftCheckInOut?.checkOutCoords?.longitude as any,
              }] : []),
            ]}
          />
        </StyledMapContainer>
      }
      {
        isAdminView && (
        <Stack>
          <RHFTextField name="adminNotes" label="Admin Notes" multiline rows={3} fullWidth />
        </Stack>
      )}

      <GQLTable config={commentTableConfig} />
    </Stack>
  );
}
