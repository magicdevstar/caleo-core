import { useMutation } from "@apollo/client";
// @mui
import LoadingButton from "@mui/lab/LoadingButton";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useMemo } from "react";
// types
import { Event } from "src/__generated__/resolvers-types";
import { GET_EVENT, RESET_EVENT_THUMBNAIL } from "src/api/event";
import { DefaultEventThumbnail } from "src/components/events";
// components
import {
  RHFEditor,
  RHFTextField,
  RHFUpload,
} from "src/components/hook-form";
import RHFPhoneField from "src/components/hook-form/rhf-phone-field";
import Iconify from "src/components/iconify";
import { useBoolean } from "src/hooks/use-boolean";
import { useFeatures } from "src/hooks/use-features";
import { EditSection } from "src/sections/admin/overtimeManagement/events/common/section";
// utils
import { maxThumbnailSize } from "src/utils/event.utils";
import { fData } from "src/utils/format-number";

interface Props {
  disabled?: boolean;
  isIncident: boolean;
  currentEvent?: Event;
}

export const EventDetailSection = ({
  disabled,
  isIncident,
  currentEvent,
}: Props) => {
  const { lasdEventFields, enabledEventThumbnail } = useFeatures();
  const expand = useBoolean({ defaultValue: !lasdEventFields || isIncident });

  const initAssetUrls = useMemo(() => (currentEvent?.attachments || []) as string[], [currentEvent?.attachments]);

  const [resetThumbnail, { loading: resetThumbnailLoading }] = useMutation(RESET_EVENT_THUMBNAIL, {
    variables: {
      eventId: currentEvent?.id || '',
    },
    refetchQueries: [{
      query: GET_EVENT,
      variables: {
        id: currentEvent?.id,
      },
    }],
  });

  return (
    <EditSection title="Details" description="Event specific details">
      {
        !isIncident && lasdEventFields && (
          <>
            <RHFPhoneField
              name="commandPostContactNumber"
              label="Command Post Contact Number"
              disabled={disabled}
            />
            <RHFTextField
              name="bodyWarnTag"
              label="Body Warn Tag"
              disabled={disabled}
            />
          </>
        )
      }

      <Accordion
        disableGutters
        elevation={0}
        expanded={expand.value}
        onChange={(_, expanded) => {
          expand.setValue(expanded);
        }}
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
          sx={{
            '& .MuiAccordionSummary-content': {
              justifyContent: 'center',
              marginY: 0,
            }
          }}
        >
          <Typography variant="subtitle2">
            Notes and Attachments
          </Typography>
          <Iconify
            sx={{
              mt: 0.2,
              ml: 1,
              transform: expand.value ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 280ms'
            }}
            icon="mdi:chevron-down"
          />
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={3}>
            {
              enabledEventThumbnail && (
                <>
                  <DefaultEventThumbnail
                    name="thumbnail"
                    label="Thumbnail"
                    helperText={`Max size of ${fData(maxThumbnailSize)}. Suggested size is 250x175px.`}
                    thumbnailUrl={currentEvent?.thumbnailUrl}
                    maxSize={maxThumbnailSize}
                  />
                  <LoadingButton
                    variant="contained"
                    size="small"
                    color="error"
                    loading={resetThumbnailLoading}
                    onClick={() => resetThumbnail()}
                    sx={{ mt: 1 }}
                  >
                    Reset Thumbnail
                  </LoadingButton>
                </>
              )
            }

            <Stack spacing={1.5} sx={{ mb: 4 }}>
              <Typography variant="subtitle2" sx={{ml: 0.5}}>Notes</Typography>
              <RHFEditor readOnly={disabled} simple name="notes" />
            </Stack>

            <Stack spacing={1.5} sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ml: 0.5}}>Attachments</Typography>
              <RHFUpload
                multiple
                thumbnail
                accept={{'application/pdf': [], 'image/*': []}}
                disabled={disabled}
                initAssetUrls={initAssetUrls}
                name="attachments"
                maxSize={1e+9} // 1 GB
              />
            </Stack>
          </Stack>
        </AccordionDetails>
      </Accordion>
    </EditSection>
  );
}