import { PropsWithChildren } from 'react';
// @mui
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
// components
import { LoadingScreen } from '../loading-screen';

type QueryViewProps = PropsWithChildren & {
  errorTitle?: string;
  errorDescription?: string;
  errorImg?: React.ReactNode;
  loading?: boolean;
  error?: boolean;
  onRetry?: VoidFunction;
};

export default function QueryView({
  errorTitle = 'Failed to Load Data',
  errorDescription = 'Failed to load data. Please try again.',
  errorImg,
  loading = false,
  error = false,
  onRetry,
  children,
}: QueryViewProps) {
  if (loading) {
    return (
      <LoadingScreen
        sx={{
          borderRadius: 1.5,
          bgcolor: 'background.default',
          mt: 5,
        }}
      />
    );
  }
  if (error) {
    return (
      <Stack
        flexGrow={1}
        alignItems="center"
        justifyContent="center"
        sx={{
          mx: 'auto',
          p: 4,
          maxWidth: 600,
          textAlign: 'center',
          justifyContent: 'center',
        }}
      >
        {errorImg || (
          <Box
            component="img"
            alt="empty content"
            src="/assets/icons/empty/ic_content.svg"
            sx={{
              height: 180,
              my: { xs: 1, sm: 2 },
            }}
          />
        )}
        <Typography variant="h4" sx={{ mb: 1 }}>
          {errorTitle}
        </Typography>

        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
          {errorDescription}
        </Typography>

        <Button
          variant="contained"
          onClick={() => {
            onRetry?.();
          }}
        >
          Retry
        </Button>
      </Stack>
    );
  }

  return <>{children}</>;
}
