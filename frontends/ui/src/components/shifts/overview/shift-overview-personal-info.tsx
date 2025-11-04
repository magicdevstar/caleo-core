// @mui
import Stack from '@mui/material/Stack';
import Grid from "@mui/material/Grid";
// types
import { Shift } from 'src/__generated__/resolvers-types';
// components
import ShiftOverviewDetail from './shift-overview-detail';

type Props = {
  shift?: Shift
}

export default function ShiftOverviewPersonalInfo ({ shift }: Props) {
  return (
    <Stack spacing={3}>
      <Grid container spacing={2}>
        <ShiftOverviewDetail label='Name' value={shift?.user?.name} />
        <ShiftOverviewDetail label='Rank' value={shift?.user?.member?.rank?.name} tagColor="info" tag />
        <ShiftOverviewDetail label='Employee ID' value={shift?.user?.member?.pNumber} />
        <ShiftOverviewDetail label='Division' value={shift?.user?.member?.division?.name} tagColor="info" tag />
        <ShiftOverviewDetail label='Unit of Assignment' value={shift?.user?.member?.unit?.name} tagColor="info" tag />
        <ShiftOverviewDetail label='Volunteered/Drafted' value='Volunteered' tagColor="info" tag />
      </Grid>
    </Stack>
  );
}
