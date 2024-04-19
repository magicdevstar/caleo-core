import { forwardRef } from 'react';
// @mui
import { styled } from '@mui/material/styles';
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
    const heightAndWidth = mini ? 40 : 27;

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
        <svg
          width={heightAndWidth}
          height={heightAndWidth}
          viewBox="0 0 246 275"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            fillRule: 'evenodd',
            clipRule: 'evenodd',
            strokeLinejoin: 'round',
            strokeMiterlimit: 2,
          }}
        >
          <path
            d="M245.323,98.881C241.556,170.258 204.128,248.656 135.729,273.667C119.914,279.445 71.827,257.336 61.408,250.254C55.157,245.993 74.525,246.375 108.934,227.017C136.29,211.618 161.242,191.151 177.333,163.61C177.867,162.749 179.39,160.06 176.291,160.06C175.169,160.06 174.029,161.738 172.88,162.598C145.524,183.926 90.545,228.801 55.121,220.174C43.072,217.254 16.981,194 24.149,194.125C63.892,194.861 149.353,134.312 174.964,103.248C178.954,97.896 184.038,93.334 187.983,88.026C189.711,85.692 192.712,83.464 192.106,79.985C191.723,77.801 190.076,78.893 188.927,79.603C175.908,89.748 163.806,101.215 149.897,110.241C118.925,130.833 87.321,152.498 51.871,164.063C23.722,173.347 -5.674,135.99 0.943,135.661C6.197,135.288 11.415,134.525 16.553,133.38C44.088,126.581 68.656,112.38 92.175,97.035C97.82,93.36 103.315,89.428 108.622,85.292C114.401,80.952 119.833,76.168 124.874,70.985C126.681,69.059 128.258,67.151 126.503,64.896C95.79,82.248 64.329,103.221 28.406,106.54C8.37,109.079 11.139,86.659 11.139,71.917C11.139,61.062 11.139,45.565 24.995,42.317C55.958,34.435 85.843,22.826 113.992,7.746C118.979,5.004 123.449,0.646 129.148,0.318C134.411,0.016 138.507,4.329 142.933,6.965C180.841,29.438 219.471,39.255 239.027,44.482C247.62,46.79 245.661,92.748 245.331,98.89L245.323,98.881Z"
            style={{ fill: 'url(#_Linear1)', fillRule: 'nonzero' }}
          />
          <defs>
            <linearGradient
              id="_Linear1"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
              gradientUnits="userSpaceOnUse"
              gradientTransform="matrix(245.754,0,0,274.317,5.6679e-08,137.461)"
            >
              <stop offset="0" style={{ stopColor: 'rgb(78,170,232)', stopOpacity: 1 }} />
              <stop offset="1" style={{ stopColor: 'rgb(46,58,149)', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
        </svg>
        {!mini && (
          <StyledTitle component="h1" variant="h4">
            Caleo
          </StyledTitle>
        )}
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
