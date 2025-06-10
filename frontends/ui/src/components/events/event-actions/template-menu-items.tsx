import { useMutation } from "@apollo/client/react/hooks/useMutation";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import { CLONE_EVENT_BY_ID, CREATE_TEMPLATE_FROM_EVENT_ID } from "src/api/event";
import Iconify from "src/components/iconify";
import { useSnackbar } from "src/components/snackbar";
import { useRouter } from "src/routes/hooks";
import { paths } from "src/routes/paths";

interface IProps {
  enabled: boolean;
  eventId: string;
  menuClose: () => void;
}

export const TemplateMenuItems = ({
  enabled,
  eventId,
  menuClose,
}: IProps) => {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  
  const [cloneEvent] = useMutation(CLONE_EVENT_BY_ID, {
    onError: () => {
      enqueueSnackbar('Failed to create event. Please try again.', { variant: 'error', autoHideDuration: 2000 });
    },
    onCompleted: (data) => {
      const eId = data?.cloneEvent?.id;
      if (eId) {
        router.push(paths.dashboard.admin.overtime.eventDetail.replace(':eventId', eId));
      }
    },
  });

  const [templateFromEventId] = useMutation(CREATE_TEMPLATE_FROM_EVENT_ID, {
    onError: () => {
      enqueueSnackbar('Failed to create event template. Please try again.', { variant: 'error', autoHideDuration: 2000 });
    },
    onCompleted: (data) => {
      const eId = data?.templateEvent?.id;
      if (eId) {
        router.push(paths.dashboard.admin.overtime.templates.eventDetail.replace(':eventId', eId));
      }
    },
  });

  if (!enabled) {
    return null;
  }

  return (
    <>
      <MenuItem onClick={() => {
        cloneEvent({ variables: { id: eventId } })
        menuClose();
      }}>
        <ListItemIcon>
          <Iconify icon="solar:magic-stick-3-bold" />
        </ListItemIcon>
        <ListItemText>Clone Event</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => {
        templateFromEventId({ variables: { id: eventId } })
        menuClose();
      }}>
        <ListItemIcon>
          <Iconify icon="solar:copy-bold-duotone" />
        </ListItemIcon>
        <ListItemText>Convert to template</ListItemText>
      </MenuItem>
    </>
  );
};
