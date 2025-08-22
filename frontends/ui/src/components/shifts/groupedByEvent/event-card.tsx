import { useMemo } from "react";
import PhoneNumberFormatter from 'phone-number-formats';
// @mui
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
// hooks
import { useFeatures } from "src/hooks/use-features";
import { convertDate, useDateFormats } from "src/hooks/use-datejs";
import { useAuthContext } from "src/auth/hooks";
import { useUpcomingOvertimeLabels } from "src/hooks/use-upcoming-overtime-labels";
// components
import Image from "src/components/image";
import Label from "src/components/label";
// types
import { EventNotes } from "./event-notes";
import { EventCardShifts, CombinedShift } from "./event-card-shifts";

interface Props {
  shifts: CombinedShift[];
  isUpcoming?: boolean;
  myOvertime?: boolean;
}

export function EventCard({ shifts, isUpcoming = false, myOvertime = false }: Props) {
  const { labels: eventLabels } = useUpcomingOvertimeLabels();
  const { dateTimeFormat } = useDateFormats();
  const { user } = useAuthContext();
  const { enabledEventThumbnail } = useFeatures();

  const event = useMemo(() => {
    if (shifts.length === 0) return null;

    const firstShift = shifts[0];
    return firstShift.event;
  }, [shifts]);

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

  return (
    <Card sx={{ mb: 3 }}>
      <Stack
        direction={{ sm: 'column', md: 'row' }}
        sx={{ width: '100%', height: '100%' }}>
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
            {
              (isUpcoming) && (
                <Stack
                  direction={{ xs: 'column-reverse', md: 'row' }}
                  spacing={1}
                  alignItems={{ xs: 'end', md: 'center' }}
                  justifyContent="space-between"
                >
                  {
                    eventLabels.map((eventLabel) => !eventLabel.getHidden?.(shifts[0]) && (
                      <Label
                        sx={eventLabel.sx}
                        key={eventLabel.key}
                        variant={eventLabel.variant}
                        color={eventLabel.getColor?.(shifts[0])}
                      >
                        {eventLabel.getLabel(shifts[0])}
                      </Label>
                    ))
                  }
                </Stack>
              )
            }
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
          <EventNotes eventId={shifts[0]?.event?.id} />
        </Stack>
      </Stack>
      <EventCardShifts shifts={shifts} isUpcoming={isUpcoming} myOvertime={myOvertime} />
    </Card>
  )
}