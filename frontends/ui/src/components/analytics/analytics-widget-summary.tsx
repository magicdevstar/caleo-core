// @mui
import { alpha, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { CardProps } from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';
// theme
import { bgGradient } from 'src/theme/css';
// theme
import { ColorSchema } from 'src/theme/palette';

// ----------------------------------------------------------------------

interface Props extends CardProps {
  title: string;
  total: number | string;
  icon: React.ReactNode;
  color?: ColorSchema;
  loading?: boolean;
}

export default function AnalyticsWidgetSummary({
  title,
  total,
  icon,
  color = 'primary',
  sx,
  loading,
  ...other
}: Props) {
  const theme = useTheme();

  return (
    <Stack
      alignItems="center"
      sx={{
        ...bgGradient({
          direction: '135deg',
          startColor: alpha(theme.palette[color].light, 0.2),
          endColor: alpha(theme.palette[color].main, 0.2),
        }),
        py: 2,
        borderRadius: 2,
        textAlign: 'center',
        color: `${color}.darker`,
        backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[500] : 'common.white',
        ...sx,
      }}
      {...other}
    >
      {icon && <Box sx={{ width: 64, height: 64, mb: 1 }}>{icon}</Box>}

      {loading ? (
        <Skeleton sx={{ bgcolor: `${color}.darker`, mt: 1.5, mb: 1.5 }} width={100} variant='text' />
      ) : (
        <Typography variant="h3">{total}</Typography>
      )}

      <Typography variant="subtitle2" sx={{ opacity: 0.64 }}>
        {title}
      </Typography>
    </Stack>
  );
}
