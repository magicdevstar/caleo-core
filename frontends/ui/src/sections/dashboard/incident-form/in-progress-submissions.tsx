import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useSnackbar } from 'notistack';

// @mui
import LoadingButton from '@mui/lab/LoadingButton';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import CircularProgress from '@mui/material/CircularProgress';

// components
import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';

// api
import { GET_INCIDENT_SUBMISSIONS, REMOVE_INCIDENT_SUBMISSION } from 'src/api/incidentForm';
import { convertDate } from 'src/hooks/use-datejs';
import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

interface IncidentFormSubmission {
  id: string;
  operationalPeriod: { date: string };
  envelopeId: string;
  event: {
    id: string;
    name: string;
    ocn?: string;
  };
  createdAt: string;
  // We would add more fields if needed for display
}

interface InProgressSubmissionsProps {
  eventId: string;
  onSelectSubmission: (submission: any) => void; // Using any for now, but could be strongly typed
}

export default function InProgressSubmissions({ eventId, onSelectSubmission }: InProgressSubmissionsProps) {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuthContext();
  const [expanded, setExpanded] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [submissionToDelete, setSubmissionToDelete] = useState<string | null>(null);

  // Query to get all submissions for the current event
  const { data, loading, error, refetch } = useQuery(GET_INCIDENT_SUBMISSIONS, {
    variables: {
      input: {
        eventId,
      }
    },
    skip: !eventId,
    fetchPolicy: 'network-only',
  });

  // Mutation to remove a submission
  const [removeSubmission, { loading: removeLoading }] = useMutation(REMOVE_INCIDENT_SUBMISSION);

  // Handle accordion toggle
  const handleToggle = () => {
    setExpanded(!expanded);
  };

  // Handle submission selection
  const handleSelectSubmission = (submission: any) => {
    onSelectSubmission(submission);
    setExpanded(false);
  };

  // Handle deletion confirmation dialog
  const handleOpenDeleteDialog = (e: React.MouseEvent, submissionId: string) => {
    e.stopPropagation();
    setSubmissionToDelete(submissionId);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSubmissionToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (submissionToDelete) {
      try {
        await removeSubmission({
          variables: {
            id: submissionToDelete,
          },
        });
        
        enqueueSnackbar('Submission deleted successfully', {
          variant: 'success',
          autoHideDuration: 3000,
        });
        
        refetch();
      } catch (err) {
        console.error('Error deleting submission:', err);
        enqueueSnackbar('Failed to delete submission', {
          variant: 'error',
          autoHideDuration: 3000,
        });
      } finally {
        handleCloseDeleteDialog();
      }
    }
  };

  const submissions = data?.incidentForms?.items || [];

  return (
    <>
      <Accordion 
        expanded={expanded}
        elevation={0}
        onChange={handleToggle}
        sx={{ 
          mb: 3,
          '&:before': { display: 'none' },
        }}
      >
        <AccordionSummary
          expandIcon={<Iconify icon="mdi:chevron-down" />}
          sx={{ px: 0, py: 1 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Iconify 
              icon="mdi:progress-clock" 
              sx={{ color: 'primary.main', mr: 1.5, width: 24, height: 24 }} 
            />
            <Typography variant="subtitle1">
              In-Progress Submissions {submissions.length > 0 && `(${submissions.length})`}
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}
          {error && (
            <Box sx={{ p: 3 }}>
              <Typography color="error">Error loading submissions</Typography>
            </Box>
          )}
          {submissions.length === 0 ? (
            <Box sx={{ p: 3 }}>
              <EmptyContent
                title="No in-progress submissions"
                description="When you save your progress, your submissions will appear here"
                sx={{ py: 3 }}
              />
            </Box>
          ) : (
            <List disablePadding>
              {submissions.map((submission: IncidentFormSubmission) => (
                <ListItem key={submission.id} disablePadding divider>
                  <ListItemButton onClick={() => handleSelectSubmission(submission)}>
                    <ListItemText
                      primary={convertDate({
                        date: submission.operationalPeriod.date,
                        user,
                      }).format('MM/DD/YYYY')}
                    />
                    <IconButton 
                      edge="end" 
                      color="error" 
                      onClick={(e) => handleOpenDeleteDialog(e, submission.id)}
                    >
                      <Iconify icon="solar:trash-bin-trash-bold-duotone" />
                    </IconButton>
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </AccordionDetails>
      </Accordion>

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        title="Delete Submission"
        content="Are you sure you want to delete this submission? This action cannot be undone."
        action={
          <LoadingButton 
            variant="contained" 
            color="error" 
            onClick={handleConfirmDelete}
            loading={removeLoading}
          >
            Delete
          </LoadingButton>
        }
      />
    </>
  );
}
