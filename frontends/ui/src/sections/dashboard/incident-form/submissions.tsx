import { useState } from 'react';
import omitDeep from 'omit-deep';
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
import { IncidentForm, IncidentFormStatus } from 'src/__generated__/resolvers-types';

// api
import { GET_INCIDENT_SUBMISSIONS, REMOVE_INCIDENT_SUBMISSION, UPSERT_INCIDENT_SUBMISSION } from 'src/api/incidentForm';
import { convertDate } from 'src/hooks/use-datejs';
import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

interface SubmissionsProps {
  eventId: string;
  onSelectSubmission: (submission: any) => void; // Using any for now, but could be strongly typed
}

export default function Submissions({ eventId, onSelectSubmission }: SubmissionsProps) {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuthContext();
  const [expanded, setExpanded] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [submissionToDelete, setSubmissionToDelete] = useState<string | null>(null);

  const [duplicateSubmission, { loading: duplicateLoading }] = useMutation(UPSERT_INCIDENT_SUBMISSION, {
      refetchQueries: [
        {
          query: GET_INCIDENT_SUBMISSIONS,
          variables: { input: { eventId } },
        },
      ],
    });

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
  const handleSelectSubmission = (submission: IncidentForm) => {
    if (submission.status === IncidentFormStatus.Draft) {
      onSelectSubmission(submission);
      setExpanded(false);
    }
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
  
  // Handle duplicating a submitted form
  const handleDuplicateSubmission = async (e: React.MouseEvent, submission: IncidentForm) => {
    e.stopPropagation();
    try {
      // Use omitDeep to remove typename and id fields throughout the nested object
      const cleanedData = omitDeep(JSON.parse(JSON.stringify(submission)), ['__typename', 'id', 'event', 'envelopeId', 'createdAt', 'status']);
      
      const res = await duplicateSubmission({
        variables: {
          input: {
            ...cleanedData,
            eventId,
          },
          saveOnly: true,
        },
      });
      
      enqueueSnackbar('Submission duplicated successfully', {
        variant: 'success',
        autoHideDuration: 3000,
      });
      
      refetch();

      if (res.data?.incidentForm?.incidentForm) {
        handleSelectSubmission(res.data?.incidentForm?.incidentForm);
      }
    } catch (err) {
      let message = 'Failed to duplicate submission';
      if (err.message === 'An incident form already exists for this event and date') {
        message = 'A submission already exists for this date';
      }
      enqueueSnackbar(message, {
        variant: 'error',
        autoHideDuration: 3000,
      });
    }
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
              {submissions.length > 0 
                ? `Submissions (${submissions.length})`
                : 'Submissions'}
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
                title="No submissions found"
                description="When you submit or save your progress, your submissions will appear here"
                sx={{ py: 3 }}
              />
            </Box>
          ) : (
            <List disablePadding>
              {submissions.map((submission: IncidentForm) => (
                <ListItem key={submission.id} disablePadding divider>
                  <ListItemButton onClick={() => handleSelectSubmission(submission)}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body1">
                            {convertDate({
                              date: submission.operationalPeriod.date,
                              user,
                            }).format('MM/DD/YYYY')}
                          </Typography>
                          {submission.status && (
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                ml: 1,
                                px: 1, 
                                py: 0.5, 
                                borderRadius: 1,
                                bgcolor: submission.status === IncidentFormStatus.Submitted 
                                  ? 'success.lighter' 
                                  : 'warning.lighter',
                                color: submission.status === IncidentFormStatus.Submitted 
                                  ? 'success.dark' 
                                  : 'warning.dark',
                              }}
                            >
                              {submission.status === IncidentFormStatus.Submitted ? 'Submitted' : 'Draft'}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    {submission.status === IncidentFormStatus.Submitted ? (
                      <IconButton 
                        edge="end" 
                        color="info" 
                        onClick={(e) => handleDuplicateSubmission(e, submission)}
                        title="Duplicate this submission"
                      >
                        <Iconify icon="solar:copy-bold-duotone" />
                      </IconButton>
                    ) : (
                      <IconButton 
                        edge="end" 
                        color="error" 
                        onClick={(e) => handleOpenDeleteDialog(e, submission.id)}
                        title="Delete this submission"
                      >
                        <Iconify icon="solar:trash-bin-trash-bold-duotone" />
                      </IconButton>
                    )}
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
