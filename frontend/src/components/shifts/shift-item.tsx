import { useMemo, useState } from "react";
import { format } from "date-fns";
// mui
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
// types
import { Rank, Shift, Skill } from "src/__generated__/resolvers-types";
// components
import CustomPopover, { usePopover } from "src/components/custom-popover";
import Iconify from "src/components/iconify";
import Label from "src/components/label";
import { reader } from "src/layouts/_common/notifications-popover/notification-item";

const ShortId = require('id-shorter');

const shortId = ShortId();

export default function ShiftItem({
  shift,
  shiftActions,
}: {
  shift: Shift;
  shiftActions: {
    key: string;
    onClick: (shift: Shift) => void;
    getIcon: (shift: Shift) => string;
    getName: (shift: Shift) => string;
  }[];
}) {
  const [detailHeight, setDetailHeight] = useState<string>('0px');
  const popover = usePopover();

  const requiredSkillRender = useMemo(() => {
    let value: any = (
      <Label variant="soft" color='info'>
        N/A
      </Label>
    );
    if (shift?.assignment?.requiredSkills && shift?.assignment?.requiredSkills?.length > 0) {
      value = (shift?.assignment?.requiredSkills as any[])?.map((skill: Skill) => (
        <Label key={skill.id} variant="soft" color='info'>
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
        <Label key={rank.id} variant="soft" color='info'>
          {rank.name}
        </Label>
      ));
    }

    return value;
  }, [shift]);

  const assignedToShift = useMemo(() => {
    let value: any = (
      <Label variant="soft" color='info'>
        N/A
      </Label>
    );
    const assigned = (shift as any)?.otherShiftSlots?.filter((slot: Shift) => slot?.user);
    if (assigned?.length > 0) {
      value = assigned?.map((slot: Shift) => (
        <Label key={slot.id} variant="soft" color='info'>
          {slot.user?.firstName} {slot.user?.lastName} ({slot.user?.member?.pNumber})
        </Label>
      ));
    }

    return value;
  }, [shift]);

  const contactInfo = useMemo(() => {
    let value: any = (
      <Label variant="soft" color='info'>
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
        details.push(`Phone: ${contact.phone}`);
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

  const dates = {
    startTime: format(new Date(shift.startTime), 'EEEEEE dd MMM yyyy HH:mm'),
    endTime: format(new Date(shift.endTime), 'EEEEEE dd MMM yyyy HH:mm'),
  };

  return (
    <Grid sm={12} md={6} sx={{ padding: 1, transition: 'all .15s ease-in-out' }}>
      <Stack
        onClick={() => {
          setDetailHeight((c) => c === '0px' ? '100%' : '0px');
        }}
        component={Card}
        direction="row"
        sx={{ cursor: 'pointer', width: '100%', height: '100%' }}
      >
        <Stack
          sx={{
            width: '100%',
            p: (theme) => theme.spacing(3, 3, 2, 3),
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box component="span" sx={{ typography: 'caption', color: 'text.disabled' }}>
              {dates.startTime} - {dates.endTime}
            </Box>

            <IconButton color={popover.open ? 'inherit' : 'default'} onClick={(e) => {
              e.stopPropagation();
              popover.onOpen(e);
            }}>
              <Iconify icon="eva:more-horizontal-fill" />
            </IconButton>
          </Stack>

          <Stack spacing={1} flexGrow={1} sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{
              '&:hover': {
                textDecoration: 'underline',
              }
            }}>
              {shift.event.name} - {shift.assignment.name}
            </Typography>

            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {shift?.event?.venue?.name || 'N/A'}
            </Typography>

            {/* Above the fold grid content */}
            <Grid container>
              <Grid item xs={12} sm={6}>
                {/* BW Needed */}
                <Stack direction="column" spacing={1} sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>BW Needed</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <Label variant="soft" color={(shift.assignment.bwNeeded && 'info') || 'default'}>
                      {shift.assignment.bwNeeded ? 'Yes' : 'No'}
                    </Label>
                  </Box>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={6}>
                {/* Event Ref */}
                <Stack direction="column" spacing={1} sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Event Ref</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <Label variant="soft" color='default'>
                      {shortId.encode(shift.event.id)}
                    </Label>
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          </Stack>


          <Grid container sx={{ height: detailHeight, transition: 'all .15s ease-in-out' }}>
            <Grid item xs={12} sm={6}>
              {/* Include required skills */}
              <Stack direction="column" spacing={1} sx={{ mt: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Required Skills</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  {requiredSkillRender}
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12} sm={6}>
              {/* Include open to roles */}
              <Stack direction="column" spacing={1} sx={{ mt: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Open to roles</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  {openRolesRender}
                </Box>
              </Stack>
            </Grid>

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

            <Grid item xs={12} sm={6}>
              {/* Include attachments */}
            </Grid>

            <Grid item xs={12}>
              <Stack direction="column" spacing={1} sx={{ mt: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Event notes</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', flexWrap: 'wrap', gap: '10px' }}>
                  <Label
                    sx={{
                      padding: '10px !important',
                      whiteSpace: 'pre-line',
                      height: 'fit-content',
                      lineHeight: '1.5rem',
                      fontSize: '14px',
                      justifyContent: 'flex-start',
                      width: '100%',
                    }}
                    variant="soft"
                    color='default'
                  >
                    { shift.event.notes && shift.event.notes.trim() !== '' ? reader(shift.event.notes || '') : 'N/A'}
                  </Label>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </Stack>
      </Stack>

      <CustomPopover
        open={popover.open}
        onClose={popover.onClose}
        arrow="bottom-center"
        sx={{ width: 140 }}
      >
        {shiftActions.map(({
          onClick,
          key,
          getIcon,
          getName,
        }) => (
          <MenuItem
            key={key}
            onClick={() => {
              onClick(shift);
            }}
          >
            <Iconify icon={getIcon(shift)} />
            {getName(shift)}
          </MenuItem>
        ))}
      </CustomPopover>
    </Grid>
  );
}
