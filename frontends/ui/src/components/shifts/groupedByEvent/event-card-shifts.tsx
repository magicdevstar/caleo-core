import { useCallback } from 'react';
import { PDFDocument } from "pdf-lib";
import { useSnackbar } from 'notistack';
import { isAfter, isBefore, subHours } from 'date-fns';
import capitalize from 'lodash/capitalize';
import orderBy from 'lodash/orderBy';
// @mui
import LoadingButton from '@mui/lab/LoadingButton';
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
import { useDownloadPdf } from 'src/hooks/use-download-pdf';
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
import { ShiftActivityDialog } from './shift-activitiy-dialog';

export interface ExtendedShift extends Shift {
  prefixText?: string;
}

export interface ExtendedShiftBufferRequest extends ShiftBufferRequest {
  prefixText?: string;
}

export type CombinedShift = ExtendedShift | ExtendedShiftBufferRequest;

const myOvertimeButtonInfo = (shift: CombinedShift) => {
  if (shift.prefixText === 'UnfulfilledInterestRequest') {
    return {
      icon: 'ic:round-cancel',
      title: 'Remove Interest',
      disabled: false,
    }
  }
  if (shift.__typename === 'ShiftBufferRequest') {
    return {
      icon: 'mdi:close-thick',
      title: 'Cancel Buffer Request',
      disabled: false,
    };
  }

  if ([ShiftStatus.Relinquished, ShiftStatus.Unassigned, ShiftStatus.Removed].includes(shift.status as ShiftStatus)) {
    return {
      icon: 'mdi:close-thick',
      title: shift.status === ShiftStatus.Relinquished ? 'Scratched' : capitalize(shift.status),
      disabled: false,
    };
  }

  if (!shift?.org?.settings?.userRelinquishShift?.enabled) {
    return {
      icon: 'mdi:check',
      title: ['completed', 'voided', 'declined'].includes((shift as Shift)?.docusignEvent?.status || '') ? 'Download Document' : 'Secured',
      disabled: (shift as Shift)?.docusignEvent?.status !== 'completed',
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
      title: ['completed', 'voided', 'declined'].includes((shift as Shift)?.docusignEvent?.status || '') ? 'Download Document' : 'Secured',
      disabled: (shift as Shift)?.docusignEvent?.status !== 'completed',
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
  color: (shift: Shift) => ['completed', 'voided', 'declined'].includes(shift?.docusignEvent?.status || '') ? 'success' : 'error',
  disabled: (shift: CombinedShift) => myOvertimeButtonInfo(shift).disabled,
  onClick: (shift: CombinedShift, confirm: UseBooleanReturnType<CombinedShift>) => confirm.onTrue(shift),
  getIcon: (shift: CombinedShift) => myOvertimeButtonInfo(shift).icon,
  getName: (shift: CombinedShift) => myOvertimeButtonInfo(shift).title,
};

const shiftAction = {
  key: 'signUp',
  disabled: (shift: CombinedShift) => false,
  color: (shift: Shift): string => {
    if (['completed', 'voided', 'declined'].includes(shift?.docusignEvent?.status || '')) {
      return 'success';
    }
    if (shift.shiftInterestRequest?.id) {
      return 'error';
    }
    return 'info';
  },
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
  const { enqueueSnackbar } = useSnackbar();
  const { labels: rawShiftLabels } = useAvailableOvertimeLabels();
  const shiftLabels = rawShiftLabels[0];
  const { user } = useAuthContext();
  const downloadLoading = useBoolean<CombinedShift>();
  const assignConfirm = useBoolean<Shift>();
  const interestConfirm = useBoolean<Shift>();
  const relinquishConfirm = useBoolean<CombinedShift>();
  const menuOpen = useBoolean<CombinedShift>();
  const assignmentNotesOpen = useBoolean<CombinedShift>();
  const activityDialogOpen = useBoolean<CombinedShift>();
  const { download } = useDownloadPdf({
      fileName: 'end-of-shift-document',
    });

  const downloadDocuments = useCallback(async (shift: Shift) => {
    try {
      downloadLoading.onTrue(shift);
      if (shift?.docusignEvent?.documentUrls) {
        const pdfDoc = await PDFDocument.create();
        // eslint-disable-next-line no-restricted-syntax
        for (const url of shift?.docusignEvent?.documentUrls || []) {
          // download overtime slip
          const slipPdfBytes = await fetch(url as string).then(response => response.arrayBuffer()); // eslint-disable-line no-await-in-loop
          // load/convert the slip into a PDFDocument object
          const slipPdfDoc = await PDFDocument.load(slipPdfBytes); // eslint-disable-line no-await-in-loop
          // iterate over slip's pages
          const slipPages = await pdfDoc.copyPages(slipPdfDoc, slipPdfDoc.getPageIndices()); // eslint-disable-line no-await-in-loop
          // add pages to main pdf
          slipPages.forEach((page) => pdfDoc.addPage(page));
        }

        // convert pdf into file buffer
        const pdfDocBuffer = await pdfDoc.save();

        download(pdfDocBuffer, `${shift.event?.name || 'incident-submission'} - ${shift.assignment?.name || ''}`);
      }
    } catch(error) {
      enqueueSnackbar('Failed to download document', { variant: 'error' });
    } finally {
      downloadLoading.onFalse();
    }
  }, [downloadLoading, enqueueSnackbar, download]);

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
      {
        id: 'status',
        label: 'Status',
        columnType: 'string',
        renderValue: (_v: any, _i: any, shift: any) => {
          if ([ShiftStatus.Relinquished, ShiftStatus.Unassigned, ShiftStatus.Removed].includes(shift.status as ShiftStatus)) {
            return shift.status === ShiftStatus.Relinquished ? 'Scratched' : capitalize(shift.status);
          }
          if ((myOvertime || ['Assigned', 'Past'].includes(shift.prefixText || '')) && shift.prefixText !== 'UnfulfilledInterestRequest') {
            return 'Assigned';
          }
          return shiftLabels.getLabel(shift as Shift);
        },
        getLabelColor: (shift: any) => {
          if ([ShiftStatus.Relinquished, ShiftStatus.Unassigned, ShiftStatus.Removed].includes(shift.status as ShiftStatus)) {
            return 'error';
          }
          if ((myOvertime || ['Assigned', 'Past'].includes(shift.prefixText || '')) && shift.prefixText !== 'UnfulfilledInterestRequest') {
            return 'success';
          }
          return shiftLabels.getColor(shift as Shift);
        },
        width: '10%'
      },
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
        width: '35%',
      },
      ...(shifts?.[0] as Shift)?.otherShiftSlots ? [{
        id: 'otherShiftSlots',
        label: 'Remaining Slots',
        columnType: 'string',
        width: '10%',
        renderValue: (v: Shift[]) => (v || [] as Shift[]).reduce((acc, slot) => {
          if (slot.user?.id) return acc;
          return acc + 1;
        }, 0)
      }] as any : [],
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
        width: '10%',
        columnType: 'action',
        label: '',
        renderValue: (_v, _i, shift) => {
          if (isUpcoming || shift.prefixText === 'Upcoming') return null;

          const hideButton = [ShiftStatus.Relinquished, ShiftStatus.Unassigned, ShiftStatus.Removed].includes(shift.status as ShiftStatus);
          let action = shiftAction;

          if (myOvertime || ['Assigned', 'Past'].includes(shift.prefixText || '')) {
            action = myOvertimeShiftAction as any;
          }

          return (
            <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end">
              { !hideButton && (
                <LoadingButton
                  loading={downloadLoading.value && downloadLoading.attribute?.id === shift.id}
                  size="small"
                  disabled={action.disabled(shift as Shift)}
                  startIcon={<Iconify icon={action.getIcon(shift as Shift)} />}
                  onClick={(e: any) => {
                    e.stopPropagation();
                    if ([ShiftStatus.Relinquished, ShiftStatus.Unassigned, ShiftStatus.Removed].includes(shift.status as ShiftStatus)) {
                      return;
                    }
                    let confirm = assignConfirm;
                    if (shift.event.status === EventStatus.InterestList || shift.prefixText === 'UnfulfilledInterestRequest') {
                      confirm = interestConfirm;
                    }
                    if ((myOvertime || ['Assigned', 'Past'].includes(shift.prefixText || '')) && shift.prefixText !== 'UnfulfilledInterestRequest') {
                      if (['completed', 'voided', 'declined'].includes((shift as Shift)?.docusignEvent?.status || '')) {
                        downloadDocuments(shift as Shift);
                        return;
                      }
                      confirm = relinquishConfirm as any;
                    }
                    action.onClick(shift as Shift, confirm);
                  }}
                  sx={{ flex: '0 0 auto' }}
                  color={typeof (action.color as any) === 'string' ? (action.color as any) : (action.color as any)?.(shift)}
                  variant="outlined"
                >{action.getName(shift as Shift)}</LoadingButton>
              )}
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

        <MenuItem onClick={() => {
          menuOpen.onFalse();
          activityDialogOpen.onTrue(menuOpen.attribute)
        }}>
          <ListItemIcon>
            <Iconify icon="solar:history-bold" />
          </ListItemIcon>
          <ListItemText>View Activity</ListItemText>
        </MenuItem>
      </Menu>

      <AssignmentNotes 
        opener={assignmentNotesOpen} 
        assignmentId={assignmentNotesOpen?.attribute?.assignment?.id} 
      />
      <ShiftActivityDialog
        opener={activityDialogOpen}
        userId={activityDialogOpen.attribute?.userId}
        entityKey='shiftGroupId'
        entityId={activityDialogOpen.attribute?.shiftId}
      />
    </>
  );
}
