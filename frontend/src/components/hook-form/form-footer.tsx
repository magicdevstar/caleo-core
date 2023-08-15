import Box from "@mui/material/Box";
import styled from "@mui/material/styles/styled";

export const FormFooter = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'light' ? theme.palette.background.paper : theme.palette.background.default,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  position: 'sticky',
  bottom: 0,
  height: '80px',
  width: 'calc(100% + 80px)',
  marginLeft: '-40px',
  marginTop: '20px',
}));
