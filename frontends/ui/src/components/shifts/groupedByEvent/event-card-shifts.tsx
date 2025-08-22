import { isAfter, isBefore, subHours } from 'date-fns';
import orderBy from 'lodash/orderBy';
// @mui
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
// hooks
import { useAuthContext } from "src/auth/hooks";
import { useAvailableOvertimeLabels } from "src/hooks/use-available-overtime-labels";
import { useBoolean, UseBooleanReturnType } from "src/hooks/use-boolean";
// components
import GQLTable from "src/components/table/gql/table";
import Iconify from "src/components/iconify";
import ShiftAssignmentConfirmation from "src/components/shifts/confirmations/shift-assignment-confirmation";
import InterestDialog from "src/components/shifts/confirmations/interest-dialog";
import RelinquishDialog from "src/sections/dashboard/dashboard/overtime-shifts/relinquish-dialog";
import { AssignmentNotes } from "src/components/shifts/groupedByEvent/assignment-notes";
// types
import { EventStatus, Shift, ShiftBufferRequest, ShiftStatus } from "src/__generated__/resolvers-types";
import { TableConfig } from "src/components/table/table-config";
import { GET_AVAILABLE_SHIFTS } from "src/api/shifts";

export interface ExtendedShift extends Shift {
  prefixText?: string;
}

export interface ExtendedShiftBufferRequest extends ShiftBufferRequest {
  prefixText?: string;
}

export type CombinedShift = ExtendedShift | ExtendedShiftBufferRequest;

const myOvertimeButtonInfo = (shift: CombinedShift) => {
  if (shift.__typename === 'ShiftBufferRequest') {
    return {
      icon: 'mdi:close-thick',
      title: 'Cancel Buffer Request',
      disabled: false,
    };
  }

  if (!shift?.org?.settings?.userRelinquishShift?.enabled) {
    return {
      icon: 'mdi:check',
      title: 'Secured',
      disabled: true,
    };
  }
  const startDate = new Date(shift.startTime);
  const endDate = new Date(shift.endTime);
  const numberOfHoursBeforeShift = shift?.org?.settings?.userRelinquishShift?.numberOfHoursBeforeShift;
  const disableDate = subHours(startDate, numberOfHoursBeforeShift || 0);
  const now = new Date();
  const disabled = isAfter(now, disableDate);

  if (isAfter(now, startDate) && isBefore(now, endDate)) {
    return {
      icon: 'mdi:clock-alert',
      title: 'In Progress',
      disabled,
    }
  }
  if (isAfter(now, endDate)) {
    return {
      icon: 'mdi:check',
      title: 'Secured',
      disabled,
    }
  }
  if ((shift as Shift).locked || shift.status === ShiftStatus.Locked) {
    return {
      icon: 'mdi:lock',
      title: 'Locked',
      disabled: true,
    }
  }
  return {
    icon: 'mdi:close-thick',
    title: 'Scratch',
    disabled,
  };
};

const myOvertimeShiftAction = {
  key: 'relinquish',
  color: (shift: Shift) => 'error',
  disabled: (shift: CombinedShift) => myOvertimeButtonInfo(shift).disabled,
  onClick: (shift: CombinedShift, confirm: UseBooleanReturnType<CombinedShift>) => confirm.onTrue(shift),
  getIcon: (shift: CombinedShift) => myOvertimeButtonInfo(shift).icon,
  getName: (shift: CombinedShift) => myOvertimeButtonInfo(shift).title,
};

const shiftAction = {
  key: 'signUp',
  disabled: (shift: CombinedShift) => false,
  color: (shift: Shift): string =>
    shift.shiftInterestRequest?.id ? 'error' : 'info',
  onClick: (shift: Shift, confirm: UseBooleanReturnType<Shift>) => {
    confirm.onTrue(shift);
  },
  getIcon: (shift: Shift): string => {
    if (shift.event.status === EventStatus.InterestList) {
      if (shift.shiftInterestRequest?.id) {
        return 'ic:round-cancel';
      }
      return 'ic:round-front-hand';
    }
    return 'mdi:clipboard-check';
  },
  getName: (shift: Shift): string => {
    if (shift.event.status === EventStatus.InterestList) {
      return shift.shiftInterestRequest?.id ? 'Remove Interest' : 'Show Interest';
    }
    return 'Sign Up';
  },
};

interface Props {
  shifts: CombinedShift[];
  isUpcoming?: boolean;
  myOvertime?: boolean;
}

export function EventCardShifts({ shifts, isUpcoming = false, myOvertime = false }: Props) {
  const { labels: rawShiftLabels } = useAvailableOvertimeLabels();
  const shiftLabels = rawShiftLabels[0];
  const { user } = useAuthContext();
  const assignConfirm = useBoolean<Shift>();
  const interestConfirm = useBoolean<Shift>();
  const relinquishConfirm = useBoolean<CombinedShift>();
  const menuOpen = useBoolean<CombinedShift>();
  const assignmentNotesOpen = useBoolean<CombinedShift>();

  const config: TableConfig<CombinedShift> = {
    header: {
      title: 'Assignments',
      titleVariant: 'body1',
      buttons: [],
    },
    table: {
      denseHeight: 1,
      sx: {
        minWidth: 'inherit',
      }
    },
    search: {
      data: shifts || [],
      query: GET_AVAILABLE_SHIFTS,
      processResult: (data: any, options) => {
        const res = {
          total: data.length,
          items: shifts || [],
        };

        return {
          ...res,
          items: orderBy<any>(res.items, [options?.orderBy], [options?.order || 'asc' as any]),
        }
      },
    },
    rowActions: [],
    columns: [
      ...(myOvertime ? [] : [
        {
          id: 'status',
          label: 'status',
          columnType: 'string',
          renderValue: (_v: any, _i: any, shift: any) => myOvertime || ['Assigned', 'Past'].includes(shift.prefixText || '') ? null : shiftLabels.getLabel(shift as Shift),
          getLabelColor: (shift: any) => myOvertime || ['Assigned', 'Past'].includes(shift.prefixText || '') ? '' : shiftLabels.getColor(shift as Shift),
          width: '10%'
        },
      ]) as any,
      {
        id: 'startTime',
        label: 'Start',
        columnType: 'date',
        width: '5%',
      },
      {
        id: 'assignment.name',
        label: 'Name',
        columnType: 'string',
        width: '40%',
      },
      {
        id: 'assignment.requiredEquipment',
        label: 'Required Equipment',
        width: '15%',
        noSort: true,
        columnType: 'array',
        maxRender: 1,
        emptyArrayLabel: 'None',
      },
      {
        id: '',
        width: '20%',
        columnType: 'action',
        label: '',
        renderValue: (_v, _i, shift) => {
          if (isUpcoming || shift.prefixText === 'Upcoming') return null;

          let action = shiftAction;

          if (myOvertime || ['Assigned', 'Past'].includes(shift.prefixText || '')) {
            action = myOvertimeShiftAction as any;
          }

          return (
            <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end">
              <Button
                size="small"
                disabled={action.disabled(shift as Shift)}
                startIcon={<Iconify icon={action.getIcon(shift as Shift)} />}
                onClick={(e: any) => {
                  e.stopPropagation();
                  let confirm = assignConfirm;
                  if (shift.event.status === EventStatus.InterestList) {
                    confirm = interestConfirm;
                  }
                  if (myOvertime || ['Assigned', 'Past'].includes(shift.prefixText || '')) {
                    confirm = relinquishConfirm as any;
                  }
                  action.onClick(shift as Shift, confirm);
                }}
                sx={{ flex: '0 0 auto' }}
                color={typeof (action.color as any) === 'string' ? (action.color as any) : (action.color as any)?.(shift)}
                variant="outlined"
              >{action.getName(shift as Shift)}</Button>
              <IconButton
                size="small"
                id={`shift-actions-${shift.id}`}
                aria-controls={menuOpen.value ? `shift-menu-${shift.id}` : undefined}
                aria-haspopup="true"
                aria-expanded={menuOpen.value ? 'true' : undefined}
                onClick={(e: any) => {
                  e.stopPropagation();
                  menuOpen.onTrue(shift);
                }}
                sx={{ flex: '0 0 auto' }}
              >
                <Iconify icon="eva:more-vertical-fill" />
              </IconButton>
            </Stack>
          );
        }
      },
    ],
    filters: []
  };

  return (
    <>
      <GQLTable config={config} />
      
      <ShiftAssignmentConfirmation confirm={assignConfirm} />
      <InterestDialog confirm={interestConfirm} />
      <RelinquishDialog confirm={relinquishConfirm} relinquishNoteRequired={!!user?.member?.org?.settings?.userRelinquishShift?.enabled} />
      
      <Menu
        id={`shift-menu-${menuOpen.attribute?.id}`}
        anchorEl={menuOpen.value ? document.getElementById(`shift-actions-${menuOpen.attribute?.id}`) : null}
        open={menuOpen.value}
        onClose={menuOpen.onFalse}
        MenuListProps={{
          'aria-labelledby': `shift-actions-${menuOpen.attribute?.id}`,
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
      >
        <MenuItem 
          onClick={() => {
            menuOpen.onFalse();
            assignmentNotesOpen.onTrue(menuOpen.attribute);
          }}
        >
          <ListItemIcon>
            <Iconify icon="solar:notes-bold" />
          </ListItemIcon>
          <ListItemText>View Assignment Notes</ListItemText>
        </MenuItem>

        <MenuItem disabled>
          <ListItemIcon>
            <Iconify icon="solar:history-bold" />
          </ListItemIcon>
          <ListItemText>View Activity (Coming soon)</ListItemText>
        </MenuItem>
      </Menu>

      <AssignmentNotes 
        opener={assignmentNotesOpen} 
        assignmentId={assignmentNotesOpen?.attribute?.assignment?.id} 
      />
    </>
  );
}
