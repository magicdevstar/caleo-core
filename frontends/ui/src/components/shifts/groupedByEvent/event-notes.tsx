import { useLazyQuery } from "@apollo/client";
import Stack from "@mui/material/Stack";
import Skeleton from "@mui/material/Skeleton";
import Label from "src/components/label";
import { GET_EVENT_NOTES } from "src/api/event";
import { reader } from "src/layouts/_common/notifications-popover/notification-item";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import Iconify from "src/components/iconify";
import AccordionDetails from "@mui/material/AccordionDetails";

interface Props {
  eventId: string;
}

export function EventNotes({ eventId }: Props) {
  const [fetchEventNotes, { data: eventNotes, loading }] = useLazyQuery(GET_EVENT_NOTES);

  return (
    <Accordion elevation={0} sx={{ ":before": { opacity: 0 } }} onChange={(_e, expanded) => {
      if (expanded) {
        fetchEventNotes({ variables: { id: eventId } });
      }
    }}>
      <AccordionSummary
        expandIcon={<Iconify icon="solar:alt-arrow-down-bold" />}
        aria-controls="event-notes-content"
        id="event-notes-header"
        sx={{ padding: 0 }}
      >
        Notes
      </AccordionSummary>
      <AccordionDetails>
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
            { eventNotes?.event?.notes && eventNotes?.event?.notes.trim() !== '' ? reader(eventNotes?.event?.notes || '') : 'N/A'}
          </Label>
        )}
      </AccordionDetails>
    </Accordion>
  )
}
