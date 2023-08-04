import { forwardRef } from 'react';
// @mui
import { styled, useTheme } from '@mui/material/styles';
import Link from '@mui/material/Link';
import Box, { BoxProps } from '@mui/material/Box';
import Typography from '@mui/material/Typography';
// routes
import { RouterLink } from 'src/routes/components';

// ----------------------------------------------------------------------

export interface LogoProps extends BoxProps {
  disabledLink?: boolean;
  mini?: boolean;
}

const StyledTitle = styled(Typography)(({ theme }) => ({
  backgroundColor: theme.palette.primary.light,
  backgroundImage: `linear-gradient(180deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
  backgroundSize: '100%',
  WebkitBackgroundClip: 'text',
  MozBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  MozTextFillColor: 'transparent',
})) as any;

const Logo = forwardRef<HTMLDivElement, LogoProps>(
  ({ disabledLink = false, sx, mini, ...other }, ref) => {
    const theme = useTheme();
    const PRIMARY_LIGHT = theme.palette.primary.light;

    const PRIMARY_MAIN = theme.palette.primary.main;

    // OR using local (public folder)
    // -------------------------------------------------------
    // const logo = (
    //   <Box
    //     component="img"
    //     src="/logo/logo_single.svg" => your path
    //     sx={{ width: 40, height: 40, cursor: 'pointer', ...sx }}
    //   />
    // );

    const logo = (
      <Box
        ref={ref}
        component="div"
        sx={{
          width: mini ? 40 : 120,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          ...sx,
        }}
        {...other}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24">
          <defs>
            <linearGradient id="BG2" x1="50%" x2="50%" y1="0%" y2="100%">
              <stop offset="0%" stopColor={PRIMARY_LIGHT} />
              <stop offset="100%" stopColor={PRIMARY_MAIN} />
            </linearGradient>

            <linearGradient id="BG3" x1="50%" x2="50%" y1="0%" y2="100%">
              <stop offset="0%" stopColor={PRIMARY_LIGHT} />
              <stop offset="100%" stopColor={PRIMARY_MAIN} />
            </linearGradient>
          </defs>
          <g fill={PRIMARY_MAIN}>
            <path
              fill="url(#BG3)"
              d="M5.606 5.74L12 3l6.394 2.74a1 1 0 0 1 .606.92v6.858a6 6 0 0 1-3.023 5.21L12 21l-3.977-2.273A6 6 0 0 1 5 13.518V6.66a1 1 0 0 1 .606-.919Z"
              opacity=".16"
            />
            <path
              fill="url(#BG2)"
              d="m12 3l.394-.92a1 1 0 0 0-.788 0L12 3Zm0 18l-.496.868a1 1 0 0 0 .992 0L12 21Zm6.394-15.26L18 6.66l.394-.92ZM8.024 18.727l-.497.869l.496-.869Zm3.582-16.646L5.212 4.82L6 6.66l6.394-2.74l-.788-1.838ZM4 6.659v6.86h2v-6.86H4Zm3.527 12.937l3.977 2.272l.992-1.736l-3.977-2.273l-.992 1.737Zm4.97 2.272l3.976-2.272l-.992-1.737l-3.977 2.273l.992 1.736ZM20 13.518V6.66h-2v6.86h2Zm-1.212-8.697l-6.394-2.74l-.788 1.838L18 6.66l.788-1.838ZM20 6.66a2 2 0 0 0-1.212-1.838L18 6.66h2Zm-3.527 12.937A7 7 0 0 0 20 13.518h-2a5 5 0 0 1-2.52 4.341l.993 1.737ZM4 13.518a7 7 0 0 0 3.527 6.078l.992-1.737A5 5 0 0 1 6 13.52H4Zm1.212-8.697A2 2 0 0 0 4 6.66h2l-.788-1.838Z"
            />
          </g>
        </svg>
        {!mini && <StyledTitle component="h1" variant='h4'>Caleo</StyledTitle>}
      </Box>
    );

    if (disabledLink) {
      return logo;
    }

    return (
      <Link component={RouterLink} href="/" sx={{ display: 'contents' }}>
        {logo}
      </Link>
    );
  }
);

export default Logo;
