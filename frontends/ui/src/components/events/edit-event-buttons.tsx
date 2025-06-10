import { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import { Event, EventStatus } from 'src/__generated__/resolvers-types';
import { useFeatures } from 'src/hooks/use-features';
import Iconify from 'src/components/iconify/iconify';
import { useBoolean } from 'src/hooks/use-boolean';
import { DownloadSummary, DownloadSummaryMenuItem } from './event-actions/download-summary';
import { KioskMenuItems } from './event-actions/kiosk-menu-items';
import { EndOfShiftMenuItems } from './event-actions/endOfShift-menu-items';
import { OvertimeSlipsMenuItems } from './event-actions/overtimeSlips-menu-item';
import { TemplateMenuItems } from './event-actions/template-menu-items';
import KioskOpenDialog from '../custom-dialog/kiosk-dialog';
import { IncidentLinkButton } from './incident-link-button';

interface EditEventButtonsProps {
  event?: Event;
  shouldSkip: boolean;
  error?: any;
  loading: boolean;
};

export const EditEventButtons = ({
  event,
  shouldSkip,
  error,
  loading
}: EditEventButtonsProps) => {
  const {
    kiosk,
    lasdEventFields,
    eventInvoice,
    endOfShiftPDF,
    eventTemplates,
  } = useFeatures();
  
  const hideActionButtons = shouldSkip || error || loading || !event;
  const multipleButtons = (
    kiosk ||
    eventTemplates ||
    lasdEventFields ||
    eventInvoice ||
    endOfShiftPDF
  ) && event?.status !== EventStatus.Incident && !hideActionButtons;

  const kioskConfirm = useBoolean<string>();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const menuClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(e.currentTarget);
  };
  const menuClose = () => {
    setAnchorEl(null);
  };

  let actionButtons = hideActionButtons ?
    (<span />) :
    (<DownloadSummary event={event} />);

  if (event?.status === EventStatus.Incident) {
    return (<IncidentLinkButton eventId={event.id} />)
  }

  if (multipleButtons) {
    actionButtons = (
      <>
        <IconButton
          id="event-actions"
          aria-controls={open ? 'basic-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={menuClick}
        >
          <Iconify icon="eva:more-vertical-fill" />
        </IconButton>
        <Menu
          id="event-actions-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={menuClose}
          MenuListProps={{
            'aria-labelledby': 'basic-button',
          }}
        >
          <TemplateMenuItems
            enabled={eventTemplates}
            eventId={event.id}
            menuClose={menuClose}
          />

          <DownloadSummaryMenuItem
            event={event}
            menuClose={menuClose}
          />

          <OvertimeSlipsMenuItems
            enabled={lasdEventFields}
            eventId={event.id}
            menuClose={menuClose}
          />

          <KioskMenuItems
            enabled={kiosk}
            kioskConfirm={kioskConfirm}
            eventId={event.id}
            menuClose={menuClose}
          />
          <EndOfShiftMenuItems
            enabled={endOfShiftPDF}
            eventId={event.id}
            name={event.name}
            menuClose={menuClose}
          />
        </Menu>

        <KioskOpenDialog kioskConfirm={kioskConfirm} eventId={kioskConfirm.attribute || ''} />
      </>
    )
  }

  return actionButtons;
};
