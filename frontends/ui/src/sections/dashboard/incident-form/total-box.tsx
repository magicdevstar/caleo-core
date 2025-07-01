import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

interface TotalBoxProps {
  total: any;
  label: string;
  mt?: number;
}

export function TotalBox({ total, label, mt }: TotalBoxProps) {
  return (
    <Box sx={{ 
      mt,
      p: 2,
      bgcolor: 'background.neutral',
      borderRadius: 1,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <Typography variant="subtitle1">{label}:</Typography>
      <Typography variant="h6">{total}</Typography>
    </Box>
  );
}