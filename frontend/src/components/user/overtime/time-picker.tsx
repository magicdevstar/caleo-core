import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
// @mui
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import Stack from '@mui/material/Stack';
import Button from "@mui/material/Button";
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Tooltip from '@mui/material/Tooltip';
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
              ampm={false}
              timeSteps={{ hours: 1, minutes: 15, seconds: 5 }}
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
                  InputProps: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Tooltip title="Set to beginning of day" placement='left'>
                          <Iconify
                            sx={{ cursor: 'pointer' }}
                            icon="mdi:refresh"
                            onClick={() => {
                              setTime({
                                key: 'startTime',
                                value: dayjs.utc(time.startTime).startOf('day').toDate(),
                                index,
                              });
                            }}
                          />
                        </Tooltip>
                      </InputAdornment>
                    ),
                  },
                },
              }}
            />
            <TimePicker
              timezone='UTC'
              ampm={false}
              timeSteps={{ hours: 1, minutes: 15, seconds: 5 }}
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
                  InputProps: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Tooltip title="Set to end of day" placement='left'>
                          <Iconify
                            sx={{ cursor: 'pointer' }}
                            icon="mdi:refresh"
                            onClick={() => {
                              setTime({
                                key: 'endTime',
                                value: dayjs.utc(time.endTime).set('hours', 23).set('minutes', 59).toDate(),
                                index,
                              });
                            }}
                          />
                        </Tooltip>
                      </InputAdornment>
                    ),
                  },
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
