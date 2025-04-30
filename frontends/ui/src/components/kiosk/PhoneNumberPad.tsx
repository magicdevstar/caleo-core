// PhoneNumberPad.tsx
import React from 'react';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Iconify from 'src/components/iconify';

interface PhoneNumberPadProps {
  value: string;
  onChange: (newValue: string) => void;
  label?: string;
}

const PhoneNumberPad: React.FC<PhoneNumberPadProps> = ({ value, onChange, label }) => {
  const handleDigit = (digit: string) => () => onChange(value + digit);
  const handleDelete = () => onChange(value.slice(0, -1));

  const layout = [
    ['1','2','3'],
    ['4','5','6'],
    ['7','8','9'],
    ['','0','del'],
  ] as const;

  return (
    <Card sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
      <TextField
        label={label ?? 'Phone Number'}
        value={value}
        margin="normal"
        sx={{ width: 300 }}
        inputProps={{ readOnly: true }}
      />
      <Box
        display="grid"
        gridTemplateColumns="repeat(3, 1fr)"
        gap={1}
        mt={2}
        width={300}
      >
        {layout.flat().map((key, idx) => {
          if (key === '') {
            return <Box key={idx} />;
          }
          if (key === 'del') {
            return (
              <IconButton
                key={idx}
                onClick={handleDelete}
                size="large"
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '50%',
                  width: 64,
                  height: 64,
                }}
              >
                <Iconify icon="ic:baseline-backspace" fontSize="inherit" />
              </IconButton>
            );
          }
          return (
            <Button
              key={idx}
              onClick={handleDigit(key)}
              variant="outlined"
              sx={{
                borderRadius: '50%',
                width: 64,
                height: 64,
                fontSize: '1.25rem',
              }}
            >
              {key}
            </Button>
          );
        })}
      </Box>
    </Card>
  );
};

export default PhoneNumberPad;
