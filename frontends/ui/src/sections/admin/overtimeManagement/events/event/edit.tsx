import { useMemo, useEffect, useCallback } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { client } from 'src/utils/apollo';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { paths } from 'src/routes/paths';
// @mui
import Grid from '@mui/material/Unstable_Grid2';
// components
import FormProvider from 'src/components/hook-form';
import { EventOverviewSection } from 'src/sections/admin/overtimeManagement/events/event/overview-section';
import { EventDetailSection } from 'src/sections/admin/overtimeManagement/events/event/details-section';
import { EventHiringSection } from 'src/sections/admin/overtimeManagement/events/event/hiring-section';
import { EventAssignmentSection } from 'src/sections/admin/overtimeManagement/events/event/assigment-section';
import { EventSupervisionSection } from 'src/sections/admin/overtimeManagement/events/event/supervision-section';
import { EventOvertimeSection } from 'src/sections/admin/overtimeManagement/events/event/overtime-section';
// hooks
import { useRouter } from 'src/routes/hooks';
import { useDateFormats } from 'src/hooks/use-datejs';
import { useAuthContext } from 'src/auth/hooks';
import { useFeatures } from 'src/hooks/use-features';
import { useSnackbar } from 'notistack';
// types
import { Event, EventAttachmentUpload, EventStatus, Skill } from 'src/__generated__/resolvers-types';
import { EVENT_UPLOAD_URL, GET_ALL_EVENTS, GET_EVENT, UPSERT_EVENT } from 'src/api/event';
import { NewEventSchema } from './schema';

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
  const { dateTimeFormat } = useDateFormats();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuthContext();
  const {
    venueContractDates,
    interestLists,
    lottery,
    externalEventRequests,
    lasdEventFields,
    incidentEvents,
    enabledEventThumbnail
  } = useFeatures();

  const [createUploadLink] = useMutation<{eventAttachmentUploadUrl: EventAttachmentUpload}>(EVENT_UPLOAD_URL);
  const [upsertEvent, { loading: upsertEventLoading }] = useMutation(UPSERT_EVENT);

  const eventStatuses = useMemo(() => {
    const statuses = [
      EventStatus.Draft,
    ];
    if (
      lottery &&
      user.member.org?.settings?.lottery?.enabled
    ) {
      statuses.push(EventStatus.ReadyForLottery);
    }
    if (incidentEvents) {
      statuses.push(EventStatus.Incident);
    }
    if (interestLists) {
      statuses.push(EventStatus.InterestList);
    }
    if (externalEventRequests) {
      statuses.push(EventStatus.Requested);
    }
    return [
      ...statuses,
      EventStatus.FirstComeFirstServe,
      EventStatus.Complete,
      EventStatus.Removed,
    ];
  }, [user, lottery, incidentEvents, interestLists, externalEventRequests]);

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

  const disabledStatus = useMemo(() => {
    let message = 'Cannot change posting type before all shifts have been assigned a time';
    let disabled = currentEvent?.assignments?.some?.((assignment) => (assignment?.shiftSlots?.length || 0) > 0);

    if (currentEvent?.status === EventStatus.Incident) {
      disabled = true;
      message = 'Cannot change posting type of incident events';
    }

    return {
      disabled,
      message
    }
  }, [currentEvent?.assignments, currentEvent?.status]);

  const defaultValues = useMemo(
    () => ({
      id: currentEvent?.id,
      name: currentEvent?.name || '',
      status: eventTemplateView ? EventStatus.Template : (currentEvent?.status || EventStatus.Draft),
      notes: currentEvent?.notes || '',
      attachments: [],
      ocn: currentEvent?.ocn || '',
      venueId: currentEvent?.venue || null,
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
    setValue,
    watch,
    trigger,
    formState: { isSubmitting, isValid },
  } = methods;

  useEffect(() => {
    if (currentEvent) {
      reset(defaultValues);
    }
  }, [currentEvent, defaultValues, reset]);

  const currentFormValues = getValues();
  const isIncident = useMemo(() => currentFormValues.status === EventStatus.Incident, [currentFormValues.status]);
  const autoHireEndTime = useMemo(() => {
    if (currentFormValues?.interestListAutoAssignCutoff) {
      return dayjs(new Date(currentFormValues?.interestListAutoAssignCutoff));
    }

    const proposedEndTime = dayjs(
      currentEvent?.startTime ? new Date(currentEvent.startTime) : new Date()
    ).subtract(
      user.member.org?.settings?.interestList?.defaultAutoHireCutoff || 7,
      'days'
    );

    if (dayjs(Date.now()).isAfter(proposedEndTime)) {
      return dayjs(new Date(currentEvent?.startTime || Date.now())).add(24, 'hours');
    }

    return proposedEndTime;
  }, [
    currentEvent,
    currentFormValues?.interestListAutoAssignCutoff,
    user.member.org?.settings?.interestList?.defaultAutoHireCutoff
  ]);

  const formSubmit = useCallback(async (formData: any, shouldReroute = true) => {
    try {
      let imageUploadUrls = [];
      const existingAttachments = formData.attachments
        .filter(({ existing, attachmentPath }: any) => existing && attachmentPath);
      const getUploadUrls = formData.attachments.filter(({ existing }: any) => !existing);
      if (getUploadUrls.length > 0) {
        let mutation: any = 'mutation {';
        getUploadUrls.forEach((file: any, index: number) => {
          mutation += `
            attachments${index}: eventAttachmentUploadUrl {
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
        imageUploadUrls = Object.keys(data).map((key, index) => ({
          ...data[key],
          attachmentData: getUploadUrls[index],
        }));
      }

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

      const res = await upsertEvent({
        variables: {
          input: {
            id: formData?.id,
            name: formData?.name,
            notes: formData?.notes,
            status: formData?.status,
            ocn: formData?.ocn,
            geoFence: formData?.geoFence || [],
            allowOfficerCheckIn: formData?.allowOfficerCheckIn || false,
            notifyWhenFullyStaffed: formData?.notifyWhenFullyStaffed,
            autoAssignInterestList: formData?.autoAssignInterestList,
            scheduledFirstComeFirstServe: formData?.scheduledFirstComeFirstServe,
            scheduledInterestList: formData?.scheduledInterestList,
            scheduledCloseInterestList: formData?.scheduledCloseInterestList,
            interestListAutoAssignCutoff: formData?.interestListAutoAssignCutoff || autoHireEndTime.toISOString(),
            notifyOnFirstComeFirstServe: formData?.notifyOnFirstComeFirstServe,
            lotteryNumber: formData?.lotteryNumber,
            startTime: formData?.startTime ? formData?.startTime.toISOString() : null,
            endTime: formData?.endTime ? formData?.endTime.toISOString() : null,
            overrideSupervisorId: formData?.overrideSupervisor?.id || null,
            attachmentPaths: [
              ...existingAttachments,
              ...imageUploadUrls,
            ].map(({ attachmentPath }) => attachmentPath),
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

      if (imageUploadUrls.length > 0) {
        await Promise.allSettled(
          imageUploadUrls.map(({
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
  }, [upsertEvent, createUploadLink, enqueueSnackbar, autoHireEndTime, router, currentEvent, basePath]);

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
        <EventDetailSection />
        {/* Lets include lottery logic here */}
        <EventHiringSection />
        {
          lasdEventFields && (
            <>
              <EventSupervisionSection />
              <EventOvertimeSection />
            </>
          )
        }
        <EventAssignmentSection />
      </Grid>
    </FormProvider>
  );
}
