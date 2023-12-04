import Skeleton from "@mui/material/Skeleton";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Iconify from "src/components/iconify";
import Label from "src/components/label";

export default function ShiftItemSkeleton() {
  return (
    <Grid item xs={12} md={12} sx={{ padding: 1 }}>
      <Stack component={Card} direction="row" sx={{ width: '100%', height: '100%' }}>
        <Stack
          sx={{
            width: '100%',
            p: (theme) => theme.spacing(3, 3, 2, 3),
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box component="span" sx={{ typography: 'caption', color: 'text.disabled' }}>
              <Skeleton variant="text" sx={{ minWidth: '100px', fontSize: '0.75rem' }} />
            </Box>

            <IconButton color='default'>
              <Iconify icon="eva:more-horizontal-fill" />
            </IconButton>
          </Stack>

          <Stack spacing={1} flexGrow={1} sx={{ mb: 2 }}>
            <Typography variant="subtitle2">
              <Skeleton variant="text" sx={{ fontSize: '2rem' }} />
            </Typography>

            <Stack>
              <Skeleton variant="text" sx={{ maxWidth: '85%', fontSize: '1rem' }} />
              <Skeleton variant="text" sx={{ maxWidth: '82%', fontSize: '1rem' }} />
              <Skeleton variant="text" sx={{ maxWidth: '50%',fontSize: '1rem' }} />
            </Stack>
          </Stack>

          <Stack direction="row" alignItems="center">
            <Stack
              spacing={1.5}
              flexGrow={1}
              direction="row"
              justifyContent="space-between"
              sx={{
                typography: 'caption',
                color: 'text.disabled',
              }}
            >
              <Label variant="soft" color="default">
                <Skeleton variant="text" sx={{ width: '100%', minWidth: '200px', fontSize: '1rem' }} />
              </Label>

              <Label variant="soft" color='default'>
              <Skeleton variant="text" sx={{ width: '100%', minWidth: '200px', fontSize: '1rem' }} />
              </Label>

              <Label variant="soft" color='default'>
              <Skeleton variant="text" sx={{ width: '100%', minWidth: '200px', fontSize: '1rem' }} />
              </Label>

              <Label variant="soft" color='default'>
              <Skeleton variant="text" sx={{ width: '100%', minWidth: '200px', fontSize: '1rem' }} />
              </Label>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Grid>
  );
}
