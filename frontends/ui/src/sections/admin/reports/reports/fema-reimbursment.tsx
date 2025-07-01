import { useSnackbar } from 'notistack';
import { PDFDocument } from "pdf-lib";
import { useForm } from 'react-hook-form';
import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
// @mui
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import LoadingButton from '@mui/lab/LoadingButton';
// components
import FormProvider, { RHFGQLSearchAutocomplete, RHFSelect } from 'src/components/hook-form';
import { GET_ALL_EVENTS_SLIM } from 'src/api/event';
import { GET_USERS_SLIM } from 'src/api/user';
import { EventStatus, IncidentForm, MemberStatus } from 'src/__generated__/resolvers-types';
import { client } from 'src/utils/apollo';
import { GET_INCIDENT_SUBMISSIONS_DOC_DOWNLOAD } from 'src/api/incidentForm';
import { DocusignStatus } from 'src/utils/docusign';
import { useDownloadPdf } from 'src/hooks/use-download-pdf';

enum DocumentType {
  FORM_214 = 'Form 214s',
  OVERTIME_SLIP = 'OT Slips',
};

const schema = Yup.object().shape({
  docType: Yup.string().required('You must select a document type'),
  event: Yup.object().required('You must select an incident'),
  user: Yup.object().nullable(),
});

const defaultValues = {
  docType: DocumentType.FORM_214,
  event: null,
  user: null,
} as any;

export function FEMAReimbursementReport() {
  const { enqueueSnackbar } = useSnackbar();
  const { download } = useDownloadPdf({
    fileName: 'fema-reimbursement-report',
  });

  const methods = useForm({
    mode: 'onTouched',
    resolver: yupResolver(schema),
    defaultValues,
  });

  const onSubmit = methods.handleSubmit(async (values) => {
    try {
      const { data: res } = await client.query({
        query: GET_INCIDENT_SUBMISSIONS_DOC_DOWNLOAD,
        variables: {
          input: {
            eventId: values.event?.id,
            userId: values.user?.id,
          },
        },
      });
      const items = JSON.parse(JSON.stringify((res.incidentForms?.items || []))) as IncidentForm[];

      const key = values.docType === DocumentType.FORM_214 ? 0 : 1;

      const documentUrls = items
        .sort((a, b) => {
          const nameA = a.user?.lastName || '';
          const nameB = b.user?.lastName || '';
          if (nameA < nameB) {
            return -1;
          }
          if (nameA > nameB) {
            return 1;
          }
          return 0;
        })
        .filter((item) => item.docusignEvent?.status?.toUpperCase?.() === DocusignStatus.COMPLETED)
        .map((item) => item.docusignEvent?.documentUrls?.[key])
        .flat()
        .filter(Boolean);
    
      const pdfDoc = await PDFDocument.create();
      // eslint-disable-next-line no-restricted-syntax
      for (const url of documentUrls) {
        // download overtime slip
        const slipPdfBytes = await fetch(url as string).then(response => response.arrayBuffer()); // eslint-disable-line no-await-in-loop
        // load/convert the slip into a PDFDocument object
        const slipPdfDoc = await PDFDocument.load(slipPdfBytes); // eslint-disable-line no-await-in-loop
        // iterate over slip's pages
        const slipPages = await pdfDoc.copyPages(slipPdfDoc, slipPdfDoc.getPageIndices()); // eslint-disable-line no-await-in-loop
        // add pages to main pdf
        slipPages.forEach((page) => pdfDoc.addPage(page));
      }

      // convert pdf into file buffer
      const pdfDocBuffer = await pdfDoc.save();

      download(pdfDocBuffer, `${values.event?.name || 'fema-reimbursement-report'}: ${values.docType}.pdf`);
    } catch (error) {
      enqueueSnackbar('Error creating report', { variant: 'error', autoHideDuration: 3000 });
      console.error(error);
    }
  });

  return (
    <Card
      sx={{
        p: 3,
      }}
    >
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Search Criteria
        </Typography>
        <Box
          display="grid"
          rowGap={3}
          columnGap={2}
          sx={{
            mb: 4,
          }}
          gridTemplateColumns={{
            sm: 'repeat(1, 1fr)',
            lg: '1fr 33.3% 33.3%',
          }}
        >
          <RHFSelect
            name="docType"
            label="Document Type *"
          >
            {Object.values(DocumentType).map((val) => (
              <MenuItem key={val} value={val}>
                {val}
              </MenuItem>
            ))}
          </RHFSelect>

          <RHFGQLSearchAutocomplete
            name="event"
            label="Incident *"
            query={GET_ALL_EVENTS_SLIM}
            responseKey='events'
            filters={{
              status: EventStatus.Incident,
            }}
          />

          <RHFGQLSearchAutocomplete
            name="user"
            label="Officer"
            query={GET_USERS_SLIM}
            responseKey='users'
            filters={{
              statuses: [MemberStatus.Active],
            }}
          />
        </Box>
        <Stack spacing={3} alignItems="flex-end" sx={{ mt: 3 }}>
          <LoadingButton type="submit" variant="contained" loading={methods.formState.isSubmitting}>
            Create Report
          </LoadingButton>
        </Stack>
      </FormProvider>
    </Card>
  );
}