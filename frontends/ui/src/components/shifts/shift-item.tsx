import { useMemo, useState } from "react";
import PhoneNumberFormatter from 'phone-number-formats';
// mui
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import { SxProps } from "@mui/material";
// components
import Image from "src/components/image";
// types
import { Rank, Shift, ShiftBufferRequest, ShiftLotteryRequest, Skill } from "src/__generated__/resolvers-types";
// components
import CustomPopover, { usePopover } from "src/components/custom-popover";
import Iconify from "src/components/iconify";
import MapMarkersPopups from 'src/components/map/map-marker-popups';
import Label, { LabelColor, LabelVariant } from "src/components/label";
import { reader } from "src/layouts/_common/notifications-popover/notification-item";
import { convertDate, useDateFormats } from "src/hooks/use-datejs";
import { useAuthContext } from "src/auth/hooks";
import { useResponsive } from 'src/hooks/use-responsive';
import { useFeatures } from "src/hooks/use-features";
import { useLazyQuery } from "@apollo/client";
import { GET_EVENT_NOTES } from "src/api/event";
import { GET_ASSIGNMENT_DESCRIPTION } from "src/api/assignment";
import { StyledMapContainer } from "../map/styles";

export type ShiftAction = {
  key: string;
  color?: string | ((shift: any) => string);
  disabled: (shift: any) => boolean;
  onClick: (shift: any) => void;
  getIcon: (shift: any) => string;
  getName: (shift: any) => string;
};

export type ShiftLabel = {
  key: string;
  sx?: SxProps;
  variant?: LabelVariant;
  getHidden?: (shift: any) => boolean;
  getColor?: (shift: any) => LabelColor;
  getLabel: (shift: any) => string;
};

const labelSx = {
  whiteSpace: 'break-spaces',
  lineHeight: '1rem',
  height: 'auto',
  padding: '5px',
};

export default function ShiftItem({
  shift: inputShift,
  index,
  selectable = false,
  selectLoading = false,
  compact = false,
  collapsed = false,
  collapsible = true,
  onSelect = () => {},
  cursor = 'pointer',
  titlePrefix,
  shiftLabels,
  shiftActions,
  sx,
}: {
  shift: Shift | ShiftBufferRequest | ShiftLotteryRequest;
  index: number;
  selectable?: boolean;
  selectLoading?: boolean;
  compact?: boolean;
  collapsed?: boolean;
  collapsible?: boolean;
  cursor?: string;
  onSelect?: (shift: Shift, event: React.ChangeEvent<HTMLInputElement>, index: number) => void;
  titlePrefix?: {
    sx?: SxProps;
    variant?: LabelVariant;
    getHidden?: (shift: any) => boolean;
    getColor?: (shift: any) => LabelColor;
    getPrefix: (shift: any) => string;
  }
  shiftLabels?: ShiftLabel[];
  shiftActions: ShiftAction[];
  sx?: SxProps,
}) {
  const { dateTimeFormat } = useDateFormats();
  const { user } = useAuthContext();
  const [detailHeight, setDetailHeight] = useState<string>(collapsed ? '100%' : '0px');
  const popover = usePopover();
  const mdDown = useResponsive('down', 'md');
  const {
    eventCheckIn,
    eventCheckOut,
    lasdEventFields,
    callSign,
    enabledEventThumbnail,
    mapboxReportingLocation
  } = useFeatures();
  const [fetchEventNotes, { data: eventNotes }] = useLazyQuery(GET_EVENT_NOTES);
  const [fetchAssignmentNotes, { data: assignmentNotes }] = useLazyQuery(GET_ASSIGNMENT_DESCRIPTION);
  const labelComponent = useMemo(() => {
    if (inputShift.__typename === 'ShiftBufferRequest') {
      return (
        <Label sx={{ ml: 2 }} variant="soft" color='info'>
          PENDING
        </Label>
      );
    }

    return (<span />);
  }, [inputShift]);
  const shift = useMemo<Shift>(() => {
    if (['ShiftBufferRequest', 'ShiftLotteryRequest'].includes(inputShift.__typename || '')) {
      return (inputShift as any).shift as Shift;
    }
    return inputShift as Shift;
  }, [inputShift]);
  const reportingLocation = useMemo(() => {
    let assignmentAddress = shift.assignment?.reportingLocationDetails?.fullAddress;
    if (!mapboxReportingLocation) {
      assignmentAddress = shift.assignment?.reportingLocation;
    }
    const address = assignmentAddress ||
      shift.event?.reportingLocation?.fullAddress ||
      'N/A';
    const latitude = shift.assignment?.reportingLocationDetails?.location?.latitude ||
      shift.event?.reportingLocation?.location?.latitude;
    const longitude = shift.assignment?.reportingLocationDetails?.location?.longitude ||
      shift.event?.reportingLocation?.location?.longitude;

    let coordinates;
    if (latitude && longitude) {
      coordinates = {
        latitude,
        longitude,
        name: 'Reporting Location',
      };
    }

    return {
      address,
      coordinates,
    }
  }, [shift, mapboxReportingLocation]);

  const openDetails = () => {
    if (collapsible) {
      fetchEventNotes({ variables: { id: shift.event.id } });
      fetchAssignmentNotes({ variables: { id: shift.assignment.id } });
      setDetailHeight((c) => c === '0px' ? '100%' : '0px');
    }
  };

  const requiredSkillRender = useMemo(() => {
    let value: any = (
      <Label sx={{ pl: 1 }} variant="soft">
        N/A
      </Label>
    );
    if (shift?.assignment?.requiredSkills && shift?.assignment?.requiredSkills?.length > 0) {
      value = (shift?.assignment?.requiredSkills as any[])?.map((skill: Skill) => (
        <Label key={skill.id} variant="soft" color='info' sx={labelSx}>
          {skill.name}
        </Label>
      ));
    }
    return value;
  }, [shift]);

  const openRolesRender = useMemo(() => {
    let value: any = (
      <Label variant="soft" color='info'>
        All
      </Label>
    );
    if (shift?.assignment?.ranks && shift?.assignment?.ranks?.length > 0) {
      value = (shift?.assignment?.ranks as any)?.map((rank: Rank) => (
        <Label key={rank.id} variant="soft" color='info' sx={labelSx}>
          {rank.name}
        </Label>
      ));
    }

    return value;
  }, [shift]);

  const assignedToShift = useMemo(() =>
    (shift as any)?.otherShiftSlots?.map((slot: Shift) => (
      <Label key={slot.id} variant="soft" color='info' sx={labelSx}>
        Shift # {slot.refNumber} { slot.user ? `${slot.user?.firstName} ${slot.user?.lastName} (${slot.user?.member?.pNumber})` : ('N/A') }
      </Label>
    )),
  [shift]);

  const attachmentLabels = useMemo(() => {
    const attachmentCount = (shift as Shift).event.attachments?.length || 0;
    if (attachmentCount <= 0) {
      return (
        <Label variant="soft" sx={{...labelSx, width: 'fit-content'}}>
          N/A
        </Label>
      );
    }

    return (shift as Shift)?.event?.attachments?.map((url: string, i: number) => (
      <Label key={url} variant="soft" color='info' sx={{...labelSx, width: 'fit-content', cursor}} onClick={(e) => {
        e.stopPropagation();
        window.open(url, '_blank');
      }}>
        Attachment # {i + 1}
      </Label>
    ));
  }, [shift, cursor]);

  const contactInfo = useMemo(() => {
    let value: any = (
      <Label variant="soft">
        N/A
      </Label>
    );
    const contact = shift?.event?.venue?.contact || {};
    if (contact && Object.values(contact).some((v) => v !== null)) {
      const details = [];
      if (contact.firstName || contact.lastName) {
        details.push(`Name: ${contact.firstName} ${contact.lastName}`);
      }
      if (contact.email) {
        details.push(`Email: ${contact.email}`);
      }
      if (contact.phone) {
        let phoneThing = contact.phone;
        try {
          phoneThing = new PhoneNumberFormatter(contact.phone).format({type: 'domestic'}).string;
        } catch(error) {
          console.error(error);
        }
        details.push(`Phone: ${phoneThing}`);
      }
      value = (
        <Label
          sx={{
            width: 'fit-content',
            whiteSpace: 'pre-line',
            height: 'fit-content',
            lineHeight: '1.5rem',
            fontSize: '14px',
            justifyContent: 'flex-start',
          }}
          variant="soft"
          color='default'
        >
          {details.join('\n')}
        </Label>
      );
    }

    return value;
  }, [shift]);

  const totalHours = useMemo(() => {
    const start = new Date(shift.startTime);
    const end = new Date(shift.endTime);
    const diff = Math.abs(end.getTime() - start.getTime());
    const hours = Math.ceil(diff / (1000 * 60 * 60));
    return hours;
  }, [shift.startTime, shift.endTime]);

  const venueInfo = useMemo(() => {
    const venue = shift?.event?.venue;
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
  }, [shift?.event?.venue]);

  const renderShiftActions = useMemo(() => {
    if (!shiftActions?.length) {
      return null;
    }

    if (!mdDown && shiftActions.length === 1) {
      return (
        <Button
          size="small"
          disabled={shiftActions[0].disabled(shift)}
          startIcon={<Iconify icon={shiftActions[0].getIcon(shift)} />}
          onClick={(event) => {
            event.stopPropagation();
            shiftActions[0].onClick(inputShift)
          }}
          sx={{ flex: '0 0 auto' }}
          color={typeof (shiftActions[0].color as any) === 'string' ? (shiftActions[0].color as any) : (shiftActions[0].color as any)?.(shift)}
          variant="outlined"
        >{shiftActions[0].getName(inputShift)}</Button>
      );
    }

    return (
      <IconButton color={popover.open ? 'inherit' : 'default'} onClick={(e) => {
        e.stopPropagation();
        popover.onOpen(e);
      }}>
        <Iconify icon="eva:more-vertical-fill" />
      </IconButton>
    );
  }, [shiftActions, inputShift, mdDown, shift, popover])

  const dates = {
    startTime: convertDate({
      date: shift.startTime,
      user,
    }).format(dateTimeFormat),
    endTime: convertDate({
      date: shift.endTime,
      user,
    }).format(dateTimeFormat),
  };

  const hasCheckInOutData = (eventCheckIn || eventCheckOut) && shift.shiftCheckInOut;
  const checkIn = shift.shiftCheckInOut?.checkInTime;
  const checkOut = shift.shiftCheckInOut?.checkOutTime;
  const firstRowSize = hasCheckInOutData ? 3 : 4;

  const renderFirstRowDetails = (
    <>
      {hasCheckInOutData && (
        <Grid item xs={12} sm={firstRowSize}>
          {/* Check in/out */}
          <Stack direction="column" spacing={1} sx={{ mt: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Check in/out</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <Label variant="soft" color="info" sx={labelSx}>
                Check in: {checkIn ? convertDate({ date: new Date(checkIn), user }).format(dateTimeFormat) : '-'}
              </Label>
              <Label variant="soft" color="info" sx={labelSx}>
                Check out: {checkOut ? convertDate({ date: new Date(checkOut), user }).format(dateTimeFormat) : '-'}
              </Label>
              {
                shift.docusignEvent && (
                  <Label
                    onClick={(e) => {
                      e.stopPropagation();
                      if (shift.docusignEvent?.documentUrl) {
                        window.open(shift.docusignEvent.documentUrl, '_blank');
                      }
                    }}
                    variant="soft"
                    color={shift.docusignEvent.status === 'completed' ? "info" : "warning"}
                    sx={{
                      ...labelSx,
                      cursor: 'pointer',
                    }}
                  >
                    Docusign: {shift.docusignEvent.status}
                  </Label>
                )
              }
            </Box>
          </Stack>
        </Grid>
      )}
      <Grid item xs={12} sm={firstRowSize}>
        {/* BW Needed */}
        <Stack direction="column" spacing={1} sx={{ mt: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>BW Needed</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <Label variant="soft" color={(shift.assignment.bwNeeded && 'info') || 'default'} sx={labelSx}>
              {shift.assignment.bwNeeded ? 'Yes' : 'No'}
            </Label>
          </Box>
        </Stack>
      </Grid>

      <Grid item xs={12} sm={firstRowSize}>
        {/* Event Ref or call sign */}
        { callSign && !!shift.userId ? (
          <Stack direction="column" spacing={1} sx={{ mt: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Call Sign</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <Label variant="soft" color='default' sx={labelSx}>
                {shift.assignment.callSign || '-'}
              </Label>
            </Box>
          </Stack>
        ) : (
          <Stack direction="column" spacing={1} sx={{ mt: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Event Ref</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <Label variant="soft" color='default' sx={labelSx}>
                {shift.event.referenceId}
              </Label>
            </Box>
          </Stack>
        )}
      </Grid>

      <Grid item xs={12} sm={firstRowSize}>
        {/* Include required skills */}
        <Stack direction="column" spacing={1} sx={{ mt: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Required Skills</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            {requiredSkillRender}
          </Box>
        </Stack>
      </Grid>
    </>
  );

  return (
    <Grid item sm={12} sx={{ padding: 1, transition: 'all .15s ease-in-out', ...sx }}>
      <Stack
        onClick={openDetails}
        component={Card}
        direction={{ sm: 'column', md: 'row' }}
        sx={{ cursor, width: '100%', height: '100%' }}
      >
        {enabledEventThumbnail && shift.event.thumbnailUrl && (
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
              src={shift.event.thumbnailUrl}
              alt={`${shift.event.name} thumbnail`}
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
            p: (theme) => theme.spacing(3, 3, 3, 3),
          }}
        >
          <Stack sx={{ mb: 1, gap: '10px' }} direction="row" alignItems="center" justifyContent="space-between">
            <Stack
              direction="row"
              alignItems="center"
              spacing={1.5}
            >
              {
                titlePrefix && (
                  <Label
                    sx={titlePrefix.sx}
                    variant={titlePrefix.variant}
                    color={titlePrefix.getColor?.(inputShift)}
                  >
                    {titlePrefix.getPrefix(inputShift)}
                  </Label>
                )
              }
              <Typography variant="h5" sx={{
                display: 'flex',
                alignItems: 'center',
                '&:hover': {
                  textDecoration: 'underline',
                }
              }}>
                {shift.event.name} - {shift.assignment.name} {labelComponent}
              </Typography>
            </Stack>
            {
              shiftLabels?.length && (
                <Stack
                  direction={{ xs: 'column-reverse', md: 'row' }}
                  spacing={1}
                  alignItems={{ xs: 'end', md: 'center' }}
                  justifyContent="space-between"
                  sx={shiftActions.length ? {
                    ml: 'auto'
                  }: {}}
                >
                  {
                    shiftLabels.map((shiftLabel) => !shiftLabel.getHidden?.(inputShift) && (
                      <Label
                        sx={shiftLabel.sx}
                        key={shiftLabel.key}
                        variant={shiftLabel.variant}
                        color={shiftLabel.getColor?.(inputShift)}
                      >
                        {shiftLabel.getLabel(inputShift)}
                      </Label>
                    ))
                  }
                </Stack>
              )
            }
            {renderShiftActions}
            {selectable && (selectLoading ? <CircularProgress color="info" size={22} thickness={5} /> :
              <Checkbox
                checked={!!shift.lotteryRequest}
                onClick={(e) => e.stopPropagation()}
                onChange={(event) => onSelect(shift, event, index)}
                inputProps={{ 'aria-label': 'controlled' }}
              />
            )}
          </Stack>

          <Stack spacing={1} flexGrow={1} sx={{ mb: 2 }}>
            <Box component="span" sx={{ typography: 'body1', fontWeight: 'bold', opacity: '0.8' }}>
              {totalHours} hours | {dates.startTime} - {dates.endTime}
            </Box>

            <Typography variant="body2" sx={{ color: 'text.secondary', mb: compact && detailHeight === '0px' ? 1 : '' }}>
              {venueInfo.name}
              {venueInfo.address && (<><br/>{venueInfo.address}</>)}
              {venueInfo.phone && (<><br/>{venueInfo.phone}</>)}
            </Typography>

            {/* Above the fold grid content */}
            {!compact && (
              <Grid container spacing={2}>
                {renderFirstRowDetails}
              </Grid>
            )}
          </Stack>


          <Grid container spacing={2} sx={{ height: detailHeight, transition: 'all .15s ease-in-out', mt: compact ? -3 : '' }}>
            {compact && renderFirstRowDetails}
            <Grid item xs={12} sm={6}>
              {/* Include open to roles */}
              <Stack direction="column" spacing={1} sx={{ mt: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Open to roles</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  {openRolesRender}
                </Box>
              </Stack>
            </Grid>

            {
              !lasdEventFields && (
                <>
                  <Grid item xs={12} sm={6}>
                    {/* Include other people assigned */}
                    <Stack direction="column" spacing={1} sx={{ mt: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Assigned to shift</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        {assignedToShift}
                      </Box>
                    </Stack>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {/* Include contact info */}
                    <Stack direction="column" spacing={1} sx={{ mt: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Contact Info</Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', flexWrap: 'wrap', gap: '10px' }}>
                        {contactInfo}
                      </Box>
                    </Stack>
                  </Grid>
                </>
              )
            }

            {
              lasdEventFields && (
                <Grid item xs={12} sm={6}>
                  <Stack direction="column" spacing={1} sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Reporting Location</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      {reportingLocation.address}
                    </Box>
                    { reportingLocation.coordinates && (
                      <StyledMapContainer>
                        <MapMarkersPopups
                          minZoom={1}
                          attributionControl={false}
                          initialViewState={{
                            zoom: 16,
                            latitude: reportingLocation.coordinates.latitude,
                            longitude: reportingLocation.coordinates.longitude,
                          }}
                          data={[reportingLocation.coordinates]}
                        />
                      </StyledMapContainer>
                    )}
                  </Stack>
                </Grid>
              )
            }

            <Grid item xs={12} sm={6}>
              <Stack direction="column" spacing={1} sx={{ height: '100%' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Event notes</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', flexWrap: 'wrap', gap: '10px', height: '100%' }}>
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
                </Box>
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Stack direction="column" spacing={1} sx={{ height: '100%' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Assignment Notes</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', flexWrap: 'wrap', gap: '10px', height: '100%' }}>
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
                    { assignmentNotes?.assignment?.description && assignmentNotes?.assignment?.description?.trim() !== '' ? reader(assignmentNotes?.assignment?.description || '') : 'N/A'}
                  </Label>
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12}>
              {/* Include contact info */}
              <Stack spacing={1} sx={{ mt: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Attachments</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', flexWrap: 'wrap', gap: '10px' }}>
                  {attachmentLabels}
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </Stack>
      </Stack>

      <CustomPopover
        open={popover.open}
        onClose={popover.onClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
        transformOrigin={{
          vertical: 37,
          horizontal: 'right',
        }}
      >
        {shiftActions.map(({
          onClick,
          key,
          getIcon,
          getName,
          disabled,
          color
        }) => (
          <MenuItem
            disabled={disabled(inputShift)}
            key={key}
            sx={{ color: color && !disabled(inputShift) ? `${typeof color === 'string' ? color : color(inputShift)}.main` : null}}
            onClick={() => {
              onClick(inputShift);
              popover.onClose();
            }}
          >
            <Iconify icon={getIcon(inputShift)} />
            {getName(inputShift)}
          </MenuItem>
        ))}
      </CustomPopover>
    </Grid>
  );
}
