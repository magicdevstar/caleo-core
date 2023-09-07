import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
// @mui
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import Stack from '@mui/material/Stack';
import Button from "@mui/material/Button";
import IconButton from '@mui/material/IconButton';
// components
import Iconify from 'src/components/iconify/iconify';
// types
import { AvailabilityTime } from "src/__generated__/resolvers-types";

const MAX_TIMES = 3;

dayjs.extend(utc);

export default function AccountTimePicker({
  times,
  setTime,
  newTime,
  removeTime,
}: {
  times: AvailabilityTime[];
  setTime: (input: {
    key: 'startTime' | 'endTime',
    value: Date | null,
    index: number
  }) => void;
  newTime: VoidFunction;
  removeTime: (index: number) => void;
}) {
  return (
    <>
      {
        times.map((time, index) => (
          <Stack key={index} direction="row" alignItems="center" spacing={2} sx={{ pb: 2 }}>
            <TimePicker
              timezone='UTC'
              label="Start"
              value={dayjs.utc(time.startTime)}
              onChange={(newValue: any) => {
                setTime({
                  key: 'startTime',
                  value: newValue,
                  index,
                });
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  margin: 'normal',
                },
              }}
            />
            <TimePicker
              timezone='UTC'
              value={dayjs.utc(time.endTime)}
              onChange={(newValue: any) => {
                setTime({
                  key: 'endTime',
                  value: newValue,
                  index,
                });
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  margin: 'normal',
                },
              }}
            />
            <IconButton onClick={() => removeTime(index)} edge="end">
              <Iconify icon="solar:trash-bin-trash-bold-duotone" />
            </IconButton>
          </Stack>
        ))
      }
      <Button
        disabled={times.length >= MAX_TIMES}
        variant="outlined"
        onClick={newTime}
      >Add Time</Button>
    </>
  )
};
