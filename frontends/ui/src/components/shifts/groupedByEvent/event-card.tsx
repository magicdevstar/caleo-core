import { useCallback, useMemo, useState } from "react";
import { useMutation } from "@apollo/client";
import { client } from "src/utils/apollo";
// @mui
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import LoadingButton from "@mui/lab/LoadingButton";
// hooks
import { useFeatures } from "src/hooks/use-features";
import { useUpcomingOvertimeLabels } from "src/hooks/use-upcoming-overtime-labels";
import { useAuthContext } from "src/auth/hooks";
import { useSnackbar } from "notistack";
// components
import Image from "src/components/image";
import Label from "src/components/label";
import Iconify from "src/components/iconify";
// types
import { EventStatus, IncidentForm, Shift } from "src/__generated__/resolvers-types";
import { GET_ALL_SHIFTS, GET_AVAILABLE_SHIFTS, SHIFT_INTEREST_REQUEST, USER_SHIFT_INTEREST_REQUESTS } from "src/api/shifts";
import { EventNotes } from "./event-notes";
import { EventCardShifts, CombinedShift } from "./event-card-shifts";
import { EventCardIncidents } from "./event-card-incidents";

type Item = CombinedShift | IncidentForm;

interface Props {
  items: Item[];
  isUpcoming?: boolean;
  myOvertime?: boolean;
}

export function EventCard({ items, isUpcoming = false, myOvertime = false }: Props) {
  const { enqueueSnackbar } = useSnackbar();
  const [showInterestLoading, setShowInterestLoading] = useState(false);
  const { labels: eventLabels } = useUpcomingOvertimeLabels();
  const [interestRequest] = useMutation(SHIFT_INTEREST_REQUEST);
  const { user } = useAuthContext();
  const { enabledEventThumbnail, incidentEvents } = useFeatures();

  const showInterestOnAllShifts = useCallback(async () => {
    try {
      setShowInterestLoading(true);
      const shiftsToRequest = (items as unknown as Shift[])
        .filter((item) => !item.shiftInterestRequest?.id)
        .map((item) => interestRequest({
          variables: {
            shiftInterestRequest: {
              shiftGroupId: item?.shiftId,
              userId: user?.id,
            },
          },
        }));
      await Promise.all(shiftsToRequest);
      if (shiftsToRequest.length === 0) {
        enqueueSnackbar('Interest has already been shown on all shifts', { variant: 'info', autoHideDuration: 5000 });
      } else {
        enqueueSnackbar('Interest shown on all shifts', { variant: 'success', autoHideDuration: 5000 });
      }
    } catch(error) {
      enqueueSnackbar('Error showing interest on all shifts', { variant: 'error', autoHideDuration: 5000 });
    } finally {
      setShowInterestLoading(false);
      await client.refetchQueries({
        include: [GET_ALL_SHIFTS, GET_AVAILABLE_SHIFTS, USER_SHIFT_INTEREST_REQUESTS],
      });
    }
  }, [items, user, setShowInterestLoading, enqueueSnackbar, interestRequest]);

  const event = useMemo(() => {
    if (items.length === 0) return null;

    const firstShift = items[0];
    return firstShift.event;
  }, [items]);

  if (!event) return null;

  let label = null;
  if (isUpcoming) {
    label = (
      <Stack
        direction={{ xs: 'column-reverse', md: 'row' }}
        spacing={1}
        alignItems={{ xs: 'end', md: 'center' }}
        justifyContent="space-between"
      >
        {
          eventLabels.map((eventLabel) => !eventLabel.getHidden?.(items[0] as CombinedShift) && (
            <Label
              sx={eventLabel.sx}
              key={eventLabel.key}
              variant={eventLabel.variant}
              color={eventLabel.getColor?.(items[0] as CombinedShift)}
            >
              {eventLabel.getLabel(items[0] as CombinedShift)}
            </Label>
          ))
        }
      </Stack>
    );
  }
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
            height: 175,
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

          <Box component="span" sx={{ typography: 'body1', fontWeight: 'bold', opacity: '0.8' }}>
            {event?.venue?.contract?.name || 'N/A'}
          </Box>
          { (event.status === EventStatus.InterestList) && (
            <LoadingButton
              loading={showInterestLoading}
              onClick={showInterestOnAllShifts}
              variant="outlined"
              color="info"
              sx={{ maxWidth: 250 }}
              startIcon={<Iconify icon="ic:round-front-hand" />}
            >Show interest on all shifts</LoadingButton>
          )}
          <EventNotes eventId={event.id} attachments={event?.attachments || []} />
        </Stack>
      </Stack>
      {
        event.status === EventStatus.Incident ? (
          <EventCardIncidents incidents={items as IncidentForm[]} />
        ) : (
          <EventCardShifts shifts={items as CombinedShift[]} isUpcoming={isUpcoming} myOvertime={myOvertime} />
        )
      }
    </Card>
  )
}