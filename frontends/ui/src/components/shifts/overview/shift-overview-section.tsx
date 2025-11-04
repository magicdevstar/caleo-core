// @mui
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
// components
import Iconify from 'src/components/iconify';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

type Props = {
  title?: string,
  defaultExpanded?: boolean,
  children?: React.ReactNode,
  sectionActions?: React.ReactNode,
  icon?: string
}

export default function ShiftOverviewSection({
  title = 'Accordion',
  defaultExpanded = false,
  icon,
  sectionActions,
  children
}: Props) {
  return (
    <Accordion
      defaultExpanded={defaultExpanded}
      disableGutters
      elevation={0}
      sx={{
        p: 1,
        background: 'transparent',
        boxShadow: 'none !important',
        '&:before': {
          opacity: 0,
        }
      }}
    >
      <AccordionSummary
        expandIcon={
          <Iconify
            width="24px"
            height="24px"
            sx={{
              alignItems: 'center',
              lineHeight: '30px'
            }}
            icon="mdi:chevron-down"
          />
        }
      >
        <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" alignItems="center">
            {icon &&
              <Iconify
                width="30px"
                height="30px"
                color={(theme) => theme.palette.text.secondary}
                sx={{
                  mr: 1,
                  py: 0.4,
                }}
                icon={icon}
              />
            }
            <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: '30px' }}>
              { title }
            </Typography>
          </Stack>
          {sectionActions}
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ px: { xs: 2.5, md: 4 }, pt: 2, pb: 3 }}>
        { children }
      </AccordionDetails>
    </Accordion>
  );
}
