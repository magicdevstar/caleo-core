import Box from "@mui/material/Box";
import styled from "@mui/material/styles/styled";
// theme
import { bgBlur } from 'src/theme/css';

export const FormFooter = styled(Box)(({ theme }) => ({
  ...bgBlur({
    color: theme.palette.mode === 'light' ? theme.palette.background.paper : theme.palette.background.default,
  }),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  position: 'sticky',
  bottom: 0,
  marginTop: '20px',
  backdropFilter: 'blur(6px)',
  paddingTop: '22px !important',
  paddingBottom: '22px !important',
  [theme.breakpoints.down('sm')]: {
    width: `calc(100% + ${theme.spacing(4)})`,
    marginLeft: `-${theme.spacing(2)}`,
  },
  [theme.breakpoints.up('sm')]: {
    width: `calc(100% + ${theme.spacing(6)})`,
    marginLeft: `-${theme.spacing(3)}`,
  },
  [theme.breakpoints.up('lg')]: {
    width: `calc(100% + ${theme.spacing(10)})`,
    marginLeft: `-${theme.spacing(5)}`,
  }
}));
