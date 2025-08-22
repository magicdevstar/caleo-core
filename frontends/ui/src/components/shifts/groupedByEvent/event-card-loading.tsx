// @mui
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import Skeleton from "@mui/material/Skeleton";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import Table from "@mui/material/Table";
// hooks
import { useFeatures } from "src/hooks/use-features";

export function EventCardLoading() {
  const { enabledEventThumbnail } = useFeatures();

  return (
    <Card sx={{ mb: 3 }}>
      <Stack
        direction={{ sm: 'column', md: 'row' }}
        sx={{ width: '100%', height: '100%' }}>
        {enabledEventThumbnail && (
          <Box
            sx={{
              width: { sm: '100%', md: 250 },
              height: 175,
              flexShrink: 0,
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Skeleton
              variant="rectangular"
              sx={{
                width: '100%',
                height: '100%',
                borderRadius: 1,
              }}
            />
          </Box>
        )}
        <Stack
          sx={{
            width: '100%',
            p: (theme) => theme.spacing(3, 3, 0, 3),
          }}
        >
          <Stack sx={{ mb: 1, gap: '10px' }} direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Skeleton variant="text" width={200} height={32} />
            </Stack>
          </Stack>

          <Stack spacing={1} flexGrow={1} sx={{ mb: 2 }}>
            <Skeleton variant="text" width={300} height={24} />
            <Skeleton variant="text" width={250} height={20} />
            <Skeleton variant="text" width={180} height={20} />
            <Skeleton variant="text" width={160} height={20} />
          </Stack>
        </Stack>      
      </Stack>
      
      <Box sx={{ p: 3, pt: 0 }}>
        <Typography variant="body1" sx={{ mb: 2, fontWeight: 'bold' }}>
          Assignments
        </Typography>
        <Table sx={{ minWidth: 'inherit' }}>
          <TableHead>
            <TableRow>
              <TableCell width="10%">Status</TableCell>
              <TableCell width="5%">Start</TableCell>
              <TableCell width="40%">Name</TableCell>
              <TableCell width="15%">Required Equipment</TableCell>
              <TableCell width="20%" />
            </TableRow>
          </TableHead>
          <TableBody>
            {[1, 2].map((index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton variant="text" width={60} height={20} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width={80} height={20} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width={150} height={20} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width={100} height={20} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="rectangular" width={120} height={32} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Card>
  );
}
