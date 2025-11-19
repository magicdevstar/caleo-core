import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import Grid from '@mui/material/Unstable_Grid2';
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useResponsive } from "src/hooks/use-responsive";
import { SxProps, Theme } from "@mui/material/styles";

interface IProps {
  title: string;
  description: string;
  sx?: SxProps<Theme>;
  customCard?: boolean;
  children: React.ReactNode;
}

export const EditSection = ({ title, description, customCard, sx, children }: IProps) => {
  const mdUp = useResponsive('up', 'md');
  return (
    <>
      {mdUp && (
        <Grid md={2}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {description}
          </Typography>
        </Grid>
      )}
      <Grid xs={12} md={10} sx={sx}>
        {
          customCard ? children : (
            <Card>
              {!mdUp && <CardHeader title={title} />}
              <Stack spacing={3} sx={{ p: 3 }}>
                {children}
              </Stack>
            </Card>
          )
        }
      </Grid>
    </>
  );
}