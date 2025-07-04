import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';
import Iconify from 'src/components/iconify';
import Tooltip from '@mui/material/Tooltip';

export interface InfoCardProps {
  icon?: string;
  /** Main title text */
  title: string;
  /** Subtitle or supporting text */
  subtitle: string;
  /** Optional click handler */
  onClick?: () => void;
  disabled?: boolean;
  disabledTooltip?: string;
}

export default function ReportLink({
  icon = 'mdi:folder-download',
  title,
  subtitle,
  disabled,
  disabledTooltip,
  onClick
}: InfoCardProps) {
  return (
    <Tooltip title={disabledTooltip && disabled ? disabledTooltip : ''} placement='top'>
      <Card
        sx={{
          maxWidth: '100%',
          bgcolor: 'background.paper',
          opacity: disabled ? 0.6 : 1,
          boxShadow: 1,
          borderRadius: 2,
          overflow: 'hidden', // Ensures ripple effect stays within card bounds
        }}
      >
        <ButtonBase
          onClick={onClick}
          disabled={!onClick || disabled}
          sx={{
            width: '100%',
            height: '100%',
            justifyContent: 'flex-start',
            textAlign: 'left',
            cursor: onClick ? 'pointer' : 'default',
          }}
        >
          <CardContent sx={{ width: '100%' }}>
            <Box sx={{ mr: 2, fontSize: 32, color: 'primary.main' }}>
              <Iconify sx={{ color: 'warning.main' }} icon={icon} width={50} />
            </Box>
            <Box>
              <Typography variant="subtitle1" component="div" fontWeight={500}>
                {title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            </Box>
          </CardContent>
        </ButtonBase>
      </Card>
    </Tooltip>
  );
}