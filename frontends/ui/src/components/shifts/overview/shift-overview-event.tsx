import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import PhoneNumberFormatter from 'phone-number-formats';
// types
import { Event, EventStatus } from 'src/__generated__/resolvers-types';
// @mui
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
// hooks
import { useFeatures } from 'src/hooks/use-features';
import { useAuthContext } from 'src/auth/hooks';
import { useDateFormats, convertDate } from 'src/hooks/use-datejs';
import { useBoolean } from 'src/hooks/use-boolean';
// components
import { IFileDetails, PreviewDialog } from 'src/components/preview/preview-dialog';
import Label from 'src/components/label';
import { MultiFilePreview } from 'src/components/upload';
import { reader } from 'src/layouts/_common/notifications-popover/notification-item';
import Image from 'src/components/image';
import { GET_EVENT_NOTES } from 'src/api/event';
import ShiftOverviewDetail from './shift-overview-detail';

const labelSx = {
  whiteSpace: 'break-spaces',
  lineHeight: '1rem',
  height: 'auto',
  padding: '5px',
};

type Props = {
  event?: Event;
};

export default function ShiftOverviewEvent({ event }: Props) {
  const {
    data: eventNotes,
  } = useQuery(GET_EVENT_NOTES, {
    variables: { id: event?.id },
    skip: !event,
  });
  const { dateTimeFormat } = useDateFormats();
  const { user } = useAuthContext();
  const { enabledEventThumbnail, incidentEvents } = useFeatures();
  const previewDialog = useBoolean<IFileDetails>();

  const commandPostPhoneNumber = useMemo((): {
    value: string;
    validPhone?: boolean;
  } => {
    if (!event?.commandPostContactNumber) {
      return { value: 'N/A' };
    }
    try {
      const value = new PhoneNumberFormatter(event.commandPostContactNumber)?.format?.({ type: 'domestic' })?.string;
      return { value, validPhone: true };
    } catch (_error) {} // eslint-disable-line no-empty
    return { value: event.commandPostContactNumber };
  }, [event?.commandPostContactNumber]);

  const attachmentLabels = useMemo(() => {
    const attachmentCount = event?.attachments?.length || 0;
    if (attachmentCount <= 0) {
      return (
        <Label variant="soft" sx={{...labelSx, width: 'fit-content'}}>
          N/A
        </Label>
      );
    }

    return (
      <MultiFilePreview files={(event?.attachments || [])} thumbnail />
    );
  }, [event]);

  const totalHours = useMemo(() => {
    const start = new Date(event?.startTime || new Date());
    const end = new Date(event?.endTime || new Date());
    const diff = Math.abs(end.getTime() - start.getTime());
    const hours = Math.ceil(diff / (1000 * 60 * 60));
    return hours;
  }, [event]);

  const venueInfo = useMemo(() => {
    const venue = event?.venue;
    if (!venue) {
      return {
        name: 'N/A',
      };
    }
    const details: any = {
      name: venue.name,
    };
    if (venue.address) {
      details.address = `${venue.address} ${venue.city}, ${venue.state} ${venue.zip}`;
    }
    if (venue.phone) {
      let phoneThing = venue.phone;
      try {
        phoneThing = new PhoneNumberFormatter(venue.phone).format({type: 'domestic'}).string;
      } catch(error) {
        console.error(error);
      }
      details.phone = phoneThing;
    }
    return details;
  }, [event?.venue]);

  if (!event) return null;

  const dates = {
    startTime: convertDate({
      date: new Date(event.startTime!),
      user,
    }).format(dateTimeFormat),
    endTime: convertDate({
      date: new Date(event.endTime!),
      user,
    }).format(dateTimeFormat),
  };

  let label = null;
  if (incidentEvents) {
    label = (
      <Stack
        direction={{ xs: 'column-reverse', md: 'row' }}
        spacing={1}
        alignItems={{ xs: 'end', md: 'center' }}
        justifyContent="space-between"
      >
        <Label
          variant='soft'
          color='default'
        >
          { event.status === EventStatus.Incident ? 'Incident' : 'Pre Planned' }
        </Label>
      </Stack>
    );
  }

  return (
    <>
      <Stack
        direction={{ sm: 'column', md: 'row' }}
        sx={{ mb: 4 }}>
        {enabledEventThumbnail && event?.thumbnailUrl && (
          <Box
            sx={{
              width: { sm: '100%', md: 250 },
              height: 175,
              flexShrink: 0,
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Image
              src={event?.thumbnailUrl}
              alt={`${event?.name} thumbnail`}
              objectFit="contain"
              sx={{
                width: '100%',
                height: '100%',
                borderRadius: 1,
              }}
            />
          </Box>
        )}
        <Stack
          sx={{
            width: '100%',
            p: (theme) => theme.spacing(3, 3, 0, 3),
          }}
        >
          <Stack sx={{ mb: 1, gap: '10px' }} direction="row" alignItems="center" justifyContent="space-between">
            <Stack
              direction="row"
              alignItems="center"
              spacing={1.5}
            >
              <Typography variant="h5" sx={{
                display: 'flex',
                alignItems: 'center',
                '&:hover': {
                  textDecoration: 'underline',
                }
              }}>
                {event?.name}
              </Typography>
            </Stack>
            {label}
          </Stack>

          <Stack spacing={1} flexGrow={1} sx={{ mb: 2 }}>
            <Box component="span" sx={{ typography: 'body1', fontWeight: 'bold', opacity: '0.8' }}>
              {totalHours} hours | {dates.startTime} - {dates.endTime}
            </Box>

            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
              {venueInfo.name}
              {venueInfo.address && (<><br/>{venueInfo.address}</>)}
              {venueInfo.phone && (<><br/>{venueInfo.phone}</>)}
            </Typography>
          </Stack>
        </Stack>
      </Stack>

      <Grid container spacing={2}>
        <ShiftOverviewDetail label='Body Warn Tag' value={event?.bodyWarnTag} tag />
        <ShiftOverviewDetail label='Command Post Contact' value={commandPostPhoneNumber.value} tag>
          {commandPostPhoneNumber.validPhone && (
            <Link variant="body2" color={(theme) => theme.palette.info.main} underline="hover" href={`tel:${commandPostPhoneNumber.value}`}>
              {commandPostPhoneNumber.value}
            </Link>
          )}
        </ShiftOverviewDetail>
      </Grid>

      <Stack spacing={0.2} sx={{ mb: 4 }}>
        <Typography variant="body2" color="text.secondary">
          Notes
        </Typography>
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
      </Stack>

      <Stack spacing={0.2}>
        <Typography variant="body2" color="text.secondary">
          Attachments
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {attachmentLabels}
        </Box>
      </Stack>

      <PreviewDialog controller={previewDialog} />
    </>
  );
}
