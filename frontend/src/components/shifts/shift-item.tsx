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
// types
import { Rank, Shift, ShiftBufferRequest, ShiftLotteryRequest, Skill } from "src/__generated__/resolvers-types";
// components
import CustomPopover, { usePopover } from "src/components/custom-popover";
import Iconify from "src/components/iconify";
import Label, { LabelColor, LabelVariant } from "src/components/label";
import { reader } from "src/layouts/_common/notifications-popover/notification-item";
import { convertDate, dateTimeFormat } from "src/hooks/use-datejs";
import { useAuthContext } from "src/auth/hooks";

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
  onSelect = () => {},
  cursor = 'pointer',
  titlePrefix,
  shiftLabels,
  shiftActions,
}: {
  shift: Shift | ShiftBufferRequest | ShiftLotteryRequest;
  index: number;
  selectable?: boolean;
  selectLoading?: boolean;
  compact?: boolean;
  cursor?: string;
  onSelect?: (shift: Shift, event: React.ChangeEvent<HTMLInputElement>, index: number) => void;
  titlePrefix?: {
    sx?: SxProps;
    variant?: LabelVariant;
    getHidden?: (shift: any) => boolean;
    getColor?: (shift: any) => LabelColor;
    getPrefix: (shift: any) => string;
  }
  shiftLabels?: {
    key: string;
    sx?: SxProps;
    variant?: LabelVariant;
    getHidden?: (shift: any) => boolean;
    getColor?: (shift: any) => LabelColor;
    getLabel: (shift: any) => string;
  }[];
  shiftActions: {
    key: string;
    color?: string;
    disabled: (shift: any) => boolean;
    onClick: (shift: any) => void;
    getIcon: (shift: any) => string;
    getName: (shift: any) => string;
  }[];
}) {
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
  const { user } = useAuthContext();
  const [detailHeight, setDetailHeight] = useState<string>('0px');
  const popover = usePopover();

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

  const renderFirstRowDetails = (
    <>
      <Grid item xs={12} sm={4}>
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

      <Grid item xs={12} sm={4}>
        {/* Event Ref */}
        <Stack direction="column" spacing={1} sx={{ mt: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Event Ref</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <Label variant="soft" color='default' sx={labelSx}>
              {shift.event.referenceId}
            </Label>
          </Box>
        </Stack>
      </Grid>

      <Grid item xs={12} sm={4}>
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
    <Grid item sm={12} sx={{ padding: 1, transition: 'all .15s ease-in-out' }}>
      <Stack
        onClick={() => {
          setDetailHeight((c) => c === '0px' ? '100%' : '0px');
        }}
        component={Card}
        direction="row"
        sx={{ cursor, width: '100%', height: '100%' }}
      >
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
                  alignItems="center"
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
            {
              shiftActions.length === 1 && (
                <Button
                  size="small"
                  disabled={shiftActions[0].disabled(shift)}
                  startIcon={<Iconify icon={shiftActions[0].getIcon(shift)} />}
                  onClick={(event) => {
                    event.stopPropagation();
                    shiftActions[0].onClick(inputShift)
                  }}
                  sx={{ flex: '0 0 auto' }}
                  color={shiftActions[0].color as any}
                  variant="outlined"
                >{shiftActions[0].getName(inputShift)}</Button>
              )
            }
            {
              shiftActions?.length > 1 && (
                <IconButton color={popover.open ? 'inherit' : 'default'} onClick={(e) => {
                  e.stopPropagation();
                  popover.onOpen(e);
                }}>
                  <Iconify icon="eva:more-vertical-fill" />
                </IconButton>
              )
            }
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
            <Grid item xs={12} sm={4}>
              {/* Include open to roles */}
              <Stack direction="column" spacing={1} sx={{ mt: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Open to roles</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  {openRolesRender}
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12} sm={4}>
              {/* Include other people assigned */}
              <Stack direction="column" spacing={1} sx={{ mt: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Assigned to shift</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  {assignedToShift}
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12} sm={4}>
              {/* Include contact info */}
              <Stack direction="column" spacing={1} sx={{ mt: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Contact Info</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', flexWrap: 'wrap', gap: '10px' }}>
                  {contactInfo}
                </Box>
              </Stack>
            </Grid>

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
                    }}
                    variant="soft"
                    color='default'
                  >
                    { shift.event.notes && shift.event.notes.trim() !== '' ? reader(shift.event.notes || '') : 'N/A'}
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
                    }}
                    variant="soft"
                    color='default'
                  >
                    { shift.assignment?.description && shift.assignment?.description?.trim() !== '' ? reader(shift.assignment?.description || '') : 'N/A'}
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
        }) => (
          <MenuItem
            disabled={disabled(inputShift)}
            key={key}
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
