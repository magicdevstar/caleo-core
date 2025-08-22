import { useLazyQuery } from "@apollo/client";
import Stack from "@mui/material/Stack";
import Skeleton from "@mui/material/Skeleton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import Label from "src/components/label";
import Iconify from "src/components/iconify";
import { UseBooleanReturnType } from "src/hooks/use-boolean";
import { reader } from "src/layouts/_common/notifications-popover/notification-item";
import { GET_ASSIGNMENT_DESCRIPTION } from "src/api/assignment";

interface Props {
  opener: UseBooleanReturnType<any>;
  assignmentId?: string;
}

export function AssignmentNotes({ opener, assignmentId }: Props) {
  const [fetchAssignmentNotes, { data: assignmentNotes, loading }] = useLazyQuery(GET_ASSIGNMENT_DESCRIPTION);

  const handleDialogOpen = () => {
    if (opener.value) {
      fetchAssignmentNotes({ variables: { id: assignmentId } });
    }
  };

  return (
    <Dialog 
      open={opener.value} 
      onClose={opener.onFalse}
      maxWidth="sm"
      fullWidth
      TransitionProps={{
        onEntered: handleDialogOpen,
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Notes
        <IconButton
          aria-label="close"
          onClick={opener.onFalse}
          sx={{ color: (theme) => theme.palette.grey[500] }}
        >
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pb: 3 }}>
        {loading ? (
          <Stack spacing={1} sx={{ padding: '10px' }}>
            <Skeleton variant="text" width="100%" height={24} />
            <Skeleton variant="text" width="75%" height={24} />
          </Stack>
        ) : (
          <Label
            sx={{
              padding: '10px !important',
              whiteSpace: 'pre-line',
              height: '100%',
              lineHeight: '1.5rem',
              fontSize: '14px',
              justifyContent: 'flex-start',
              width: '100%',
              alignItems: 'flex-start',
              textTransform: 'none',
            }}
            variant="soft"
            color='default'
          >
            { assignmentNotes?.assignment?.description && assignmentNotes?.assignment?.description.trim() !== '' ? reader(assignmentNotes?.assignment?.description || '') : 'N/A'}
          </Label>
        )}
      </DialogContent>
    </Dialog>
  )
}
