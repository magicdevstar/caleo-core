import { m } from 'framer-motion';
// @mui
import Box, { BoxProps } from '@mui/material/Box';
import Typography from '@mui/material/Typography';
// components
import { MotionContainer, varBounce } from '../animate';

// ----------------------------------------------------------------------

interface Props extends BoxProps {
  title?: string;
  description?: string;
  img?: React.ReactNode;
}

export default function EmptyContent({ title, description, img, sx, ...other }: Props) {
  return (
    <MotionContainer>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          ...sx,
        }}
        {...other}
      >
        <m.div variants={varBounce().in}>
          <Box
            component="img"
            alt="empty content"
            src="/assets/illustrations/illustration_empty_content.svg"
            sx={{ height: 240, mb: 3 }}
          />
        </m.div>

        {title && (
          <Typography variant="h5" gutterBottom>
            {title}
          </Typography>
        )}

        {description && (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {description}
          </Typography>
        )}
      </Box>
    </MotionContainer>
  );
}
