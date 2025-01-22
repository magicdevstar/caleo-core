// @mui
import Box from '@mui/material/Box';
// hooks
import { useResponsive } from 'src/hooks/use-responsive';
//
import { HEADER } from '../config-layout';
import Header from './header';

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
};

const SPACING = 8;

export default function SimpleLayout({ children }: Props) {
  const lgUp = useResponsive('up', 'lg');

  return (
    <>
      <Header />

      <Box
        sx={{
          height: '100%',
          minHeight: 1,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
        }}
      >
        <Box
          component="main"
          sx={{
            width: '100%',
            flexGrow: 1,
            minHeight: 1,
            display: 'flex',
            flexDirection: 'column',
            py: `${HEADER.H_MOBILE + SPACING}px`,
            ...(lgUp && {
              px: 2,
              py: `${HEADER.H_DESKTOP + SPACING}px`,
            }),
          }}
        >
          {children}
        </Box>
      </Box>
    </>
  );
}
