import { useMemo, useEffect, useCallback } from 'react';
import { gql, useMutation } from '@apollo/client';
import { client } from 'src/utils/apollo';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { paths } from 'src/routes/paths';
// @mui
import Grid from '@mui/material/Unstable_Grid2';
import Button from '@mui/material/Button';
import LoadingButton from '@mui/lab/LoadingButton/LoadingButton';
// components
import FormProvider from 'src/components/hook-form';
import { EventOverviewSection } from 'src/sections/admin/overtimeManagement/events/event/overview-section';
import { EventDetailSection } from 'src/sections/admin/overtimeManagement/events/event/details-section';
import { EventHiringSection } from 'src/sections/admin/overtimeManagement/events/event/hiring-section';
import { EventAssignmentSection } from 'src/sections/admin/overtimeManagement/events/event/assigment-section';
import { EventSupervisionSection } from 'src/sections/admin/overtimeManagement/events/event/supervision-section';
import { EventOvertimeSection } from 'src/sections/admin/overtimeManagement/events/event/overtime-section';
import { EditReportingLocation } from 'src/components/events/reporting-location/edit-reporting-location';
import { RouterLink } from 'src/routes/components';
// hooks
import { useRouter } from 'src/routes/hooks';
import { useAuthContext } from 'src/auth/hooks';
import { useFeatures } from 'src/hooks/use-features';
import { useSnackbar } from 'notistack';
// types
import { Event, EventAttachmentUpload, EventStatus, Skill } from 'src/__generated__/resolvers-types';
import { EVENT_UPLOAD_URL, GET_ALL_EVENTS, GET_EVENT, UPSERT_EVENT } from 'src/api/event';
import { NewEventSchema } from './schema';
import { EditSection } from '../common/section';

// ----------------------------------------------------------------------

dayjs.extend(utc);
dayjs.extend(timezone);

type Props = {
  currentEvent?: Event;
  eventTemplateView?: boolean;
};

// ----------------------------------------------------------------------

export default function EditEvent ({
  currentEvent,
  eventTemplateView
}: Props) {
  const basePath = eventTemplateView ? paths.dashboard.admin.overtime.templates : paths.dashboard.admin.overtime
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuthContext();
  const {
    lasdEventFields,
  } = useFeatures();

  const [createUploadLink] = useMutation<{eventAttachmentUploadUrl: EventAttachmentUpload}>(EVENT_UPLOAD_URL);
  const [upsertEvent, { loading: upsertEventLoading }] = useMutation(UPSERT_EVENT);

  const allDisabled = useMemo(() => {
    const hasInvalidStatus = [EventStatus.Removed, EventStatus.Requested].includes(currentEvent?.status || '' as any);
    const isRemoved = currentEvent?.removedAt;
    return Boolean(hasInvalidStatus || isRemoved);
  }, [currentEvent?.status, currentEvent?.removedAt]);

  const isComplete = useMemo(() => {
    if (eventTemplateView) return false;
    const completeStatus = currentEvent?.status === EventStatus.Complete;
    const completeEndTime = currentEvent?.endTime ? Date.now() >= new Date(currentEvent.endTime).valueOf() : false;
    return completeStatus || completeEndTime;
  }, [
    eventTemplateView,
    currentEvent?.endTime,
    currentEvent?.status
  ]);

  const defaultValues = useMemo(
    () => ({
      id: currentEvent?.id,
      name: currentEvent?.name || '',
      status: eventTemplateView ? EventStatus.Template : (currentEvent?.status || EventStatus.Draft),
      notes: currentEvent?.notes || '',
      attachments: [],
      ocn: currentEvent?.ocn || '',
      venueId: currentEvent?.venue || null,
      bypassDemobilization: currentEvent?.bypassDemobilization || false,
      lotteryNumber: currentEvent?.lotteryNumber,
      notifyOnFirstComeFirstServe: currentEvent?.notifyOnFirstComeFirstServe || false,
      notifyWhenFullyStaffed: currentEvent?.notifyWhenFullyStaffed || false,
      autoAssignInterestList: currentEvent?.autoAssignInterestList || true,
      scheduledFirstComeFirstServe: currentEvent?.scheduledFirstComeFirstServe || '',
      scheduledInterestList: currentEvent?.scheduledInterestList || '',
      scheduledCloseInterestList: currentEvent?.scheduledCloseInterestList || '',
      interestListAutoAssignCutoff: currentEvent?.interestListAutoAssignCutoff || '',
      assignments: currentEvent?.assignments || [],
      createdById: currentEvent?.createdById || user?.id,
      outsideOrgCode: currentEvent?.outsideOrgCode,
      overtimeReasonCode: currentEvent?.overtimeReasonCode,
      budgetActivityCode: currentEvent?.budgetActivityCode,
      supervisorAssignment: currentEvent?.supervisorAssignment || null,
      lieutenantAssignment: currentEvent?.lieutenantAssignment || null,
      fieldSupervisorAssignment: currentEvent?.fieldSupervisorAssignment || null,
      startTime: currentEvent?.startTime ? new Date(currentEvent.startTime) : new Date(),
      endTime: currentEvent?.endTime ? new Date(currentEvent.endTime) : undefined,
      requiredSkills: currentEvent?.requiredSkills || [],
      overtimeNarrative: currentEvent?.overtimeNarrative || '',
      thumbnail: currentEvent?.thumbnailUrl || null,
      allowOfficerCheckIn: currentEvent?.allowOfficerCheckIn || false,
      geoFence: currentEvent?.geoFence || null,
      uniform: currentEvent?.uniform || '',
      radioFrequency: currentEvent?.radioFrequency || '',
      bodyWarnTag: currentEvent?.bodyWarnTag || '',
      commandPostContactNumber: currentEvent?.commandPostContactNumber || '',
      reportingTime: currentEvent?.reportingTime ? new Date(currentEvent.reportingTime) : null,
      briefingTime: currentEvent?.briefingTime ? new Date(currentEvent.briefingTime) : undefined,
      briefingLocation: currentEvent?.briefingLocation || '',
      overrideSupervisor: currentEvent?.overrideSupervisor || null,
      reportingLocationPosition: currentEvent?.reportingLocation?.location?.latitude && currentEvent?.reportingLocation?.location?.longitude ? [currentEvent?.reportingLocation?.location?.longitude, currentEvent?.reportingLocation?.location?.latitude] : null,
      reportingLocationAddress: currentEvent?.reportingLocation?.fullAddress ? {
        id: currentEvent?.reportingLocation?.fullAddress,
        place_name: currentEvent?.reportingLocation?.fullAddress,
        place_name_en: currentEvent?.reportingLocation?.fullAddress,
      } : null,
    }),
    [
      currentEvent,
      user,
      eventTemplateView
    ]
  );

  const methods = useForm({
    resolver: yupResolver(NewEventSchema),
    mode: 'onChange',
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    getValues,
    formState: { isValid, isSubmitting },
  } = methods;

  useEffect(() => {
    if (currentEvent) {
      reset(defaultValues);
    }
  }, [currentEvent, defaultValues, reset]);

  const currentFormValues = getValues();
  const isIncident = useMemo(() => currentFormValues.status === EventStatus.Incident, [currentFormValues.status]);

  const formSubmit = useCallback(async (formData: any, shouldReroute = true) => {
    try {
      // Get files that need uploading (new files or modified existing files)
      const filesToUpload = formData.attachments.filter(({ existing, modified }: any) => !existing || modified);
      let uploadedFiles: any[] = [];

      if (filesToUpload.length > 0) {
        let mutation: any = 'mutation {';
        filesToUpload.forEach((file: any, index: number) => {
          // Use displayName if available, otherwise fall back to file.name
          const fileName = file.displayName || file.name;
          mutation += `
            attachments${index}: eventAttachmentUploadUrl(name: "${fileName}"${formData.id ? `, eventId: "${formData.id}"` : ''}) {
              attachmentPath
              uploadUrl
            }
          `;
        });
        mutation += '}';
        mutation = gql(mutation);
        const { data } = await client.mutate({
          mutation,
        });
        uploadedFiles = Object.keys(data).map((key, index) => ({
          ...data[key],
          attachmentData: filesToUpload[index],
        }));
      }

      // Build final attachment paths array preserving original order
      let uploadIndex = 0;
      const finalAttachments = formData.attachments.map((file: any) => {
        // If file is existing and not modified, use original path
        if (file.existing && !file.modified) {
          const url = new URL(file.attachmentPath);
          return {
            attachmentPath: url.pathname.replace(/^\//, "")
          };
        }
        // If file is new or modified, use newly uploaded path
        return uploadedFiles[uploadIndex++]; // eslint-disable-line no-plusplus
      });

      let thumbnail;
      if (formData?.thumbnail && !formData?.thumbnail?.existing) {
        const res = await createUploadLink();
        if (res.data) {
          await fetch(res.data.eventAttachmentUploadUrl.uploadUrl, {
            method: 'PUT',
            body: formData.thumbnail,
            headers: {
              'Content-Type': formData.thumbnail.type,
            },
          });
          thumbnail = res.data.eventAttachmentUploadUrl.attachmentPath;
        }
      }

      if (uploadedFiles.length > 0) {
        await Promise.allSettled(
          uploadedFiles.map(({
            uploadUrl,
            attachmentData,
          }: any) => fetch(uploadUrl, {
            method: 'PUT',
            body: attachmentData,
            headers: {
              'Content-Type': attachmentData.type,
            },
          }))
        );
      }

      const res = await upsertEvent({
        variables: {
          input: {
            id: formData?.id,
            name: formData?.name,
            notes: formData?.notes,
            status: formData?.status,
            ocn: formData?.ocn,
            geoFence: formData?.geoFence || [],
            bypassDemobilization: formData?.bypassDemobilization,
            allowOfficerCheckIn: formData?.allowOfficerCheckIn || false,
            notifyWhenFullyStaffed: formData?.notifyWhenFullyStaffed,
            autoAssignInterestList: formData?.autoAssignInterestList,
            scheduledFirstComeFirstServe: formData?.scheduledFirstComeFirstServe,
            scheduledInterestList: formData?.scheduledInterestList,
            scheduledCloseInterestList: formData?.scheduledCloseInterestList,
            interestListAutoAssignCutoff: formData?.interestListAutoAssignCutoff,
            notifyOnFirstComeFirstServe: formData?.notifyOnFirstComeFirstServe,
            lotteryNumber: formData?.lotteryNumber,
            startTime: formData?.startTime ? formData?.startTime.toISOString() : null,
            endTime: formData?.endTime ? formData?.endTime.toISOString() : null,
            overrideSupervisorId: formData?.overrideSupervisor?.id || null,
            attachmentPaths: finalAttachments.map(({ attachmentPath }: any) => attachmentPath),
            venueId: formData?.venueId,
            createdById: formData?.createdById,
            outsideOrgCode: formData?.outsideOrgCode || '15778',
            overtimeReasonCode: formData?.overtimeReasonCode,
            budgetActivityCode: formData?.budgetActivityCode,
            supervisorAssignmentId: formData?.supervisorAssignment?.id,
            lieutenantAssignmentId: formData?.lieutenantAssignment?.id,
            overtimeNarrative: formData?.overtimeNarrative,
            fieldSupervisorAssignmentId: formData?.fieldSupervisorAssignment?.id,
            requiredSkillIds: formData?.requiredSkills?.map(({ id }: Skill) => id),
            uniform: formData?.uniform,
            radioFrequency: formData?.radioFrequency,
            bodyWarnTag: formData?.bodyWarnTag,
            commandPostContactNumber: formData?.commandPostContactNumber,
            reportingTime: formData?.reportingTime?.toISOString?.(),
            briefingTime: formData?.briefingTime?.toISOString?.(),
            briefingLocation: formData?.briefingLocation,
            assignmentIds: formData?.assignments?.map(
              (assignment: any) => assignment.id
            ),
            thumbnail,
            reportingLocation: formData?.reportingLocationPosition || formData?.reportingLocationAddress ? {
              fullAddress: typeof formData?.reportingLocationAddress === 'object' ? formData?.reportingLocationAddress?.place_name_en || '' : formData?.reportingLocationAddress,
              ...(formData?.reportingLocationPosition && {
                location: {
                  latitude: formData?.reportingLocationPosition[1],
                  longitude: formData?.reportingLocationPosition[0],
                }
              })
            } : null,
          },
        },
      });

      await client.refetchQueries({
        include: [GET_ALL_EVENTS, GET_EVENT]
      });

      if (shouldReroute) {
        enqueueSnackbar(currentEvent ? 'Update success!' : 'Create success!');
        if (!currentEvent) {
          router.push(basePath.eventDetail.replace(':eventId', res.data?.event?.id));
        }
      }
      return res.data?.event.id;
    } catch (error) {
      enqueueSnackbar('Failed to save changes. Please try again.', { variant: 'error' });
      console.error(error);
      return '';
    }
  }, [upsertEvent, createUploadLink, enqueueSnackbar, router, currentEvent, basePath]);

  const onSubmit = handleSubmit(async (formData: any) => {
    await formSubmit(formData);
  });

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <EventOverviewSection
          disabled={allDisabled}
          isIncident={isIncident}
          eventTemplateView={eventTemplateView}
          currentEvent={currentEvent}
        />
        <EventDetailSection
          isIncident={isIncident}
          currentEvent={currentEvent}
          disabled={allDisabled || isComplete}
        />

        {
          !isIncident && (
            <>
              {/* Lets include lottery logic here */}
              { !eventTemplateView && (
                <EventHiringSection
                  currentEvent={currentEvent}
                  disabled={allDisabled || isComplete}
                />
              )}
              {
                lasdEventFields && (
                  <>
                    <EventSupervisionSection currentEvent={currentEvent} disabled={allDisabled || isComplete} />
                    <EventOvertimeSection disabled={allDisabled || isComplete} />
                    <EditReportingLocation />
                  </>
                )
              }
              <EventAssignmentSection
                disabled={allDisabled || isComplete}
                eventTemplateView={eventTemplateView}
                currentEvent={currentEvent}
                isValid={isValid}
                upsertEventLoading={upsertEventLoading}
                formSubmit={formSubmit}
              />
            </>
          )
        }
        {
          isIncident && (
            <EventOvertimeSection disabled={allDisabled || isComplete} />
          )
        }

        <EditSection title="" description="" customCard sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <Button
            component={RouterLink}
            variant='outlined'
            size="large"
            href={basePath.events}
          >Cancel</Button>
          <LoadingButton
            type="submit"
            variant="contained"
            size="large"
            loading={isSubmitting}
            disabled={allDisabled}
            sx={{ ml: 2 }}
          >
            {!currentEvent ? 'Create Event' : 'Save Changes'}
          </LoadingButton>
        </EditSection>
      </Grid>
    </FormProvider>
  );
}
