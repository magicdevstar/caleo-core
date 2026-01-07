import { useEffect, useMemo } from "react";
import { client } from "src/utils/apollo";
import { gql, useMutation, useQuery } from "@apollo/client";
import { yupResolver } from '@hookform/resolvers/yup';
import { useSnackbar } from "notistack";
import omitDeep from "omit-deep";
import { useForm } from "react-hook-form";
import LoadingButton from "@mui/lab/LoadingButton";
import Button from "@mui/material/Button";
import Grid from '@mui/material/Unstable_Grid2';
import { Assignment, Equipment, EventStatus, Rank, Shift, Skill } from "src/__generated__/resolvers-types";
import { GET_EVENT, GET_EVENT_WITH_SUPERVISOR_OVERRIDE } from "src/api/event";
import { useFeatures } from "src/hooks/use-features";
import { useRouter } from "src/routes/hooks";
import { paths } from "src/routes/paths";
import { GET_ASSIGNMENT, UPSERT_ASSIGNMENT } from "src/api/assignment";
import FormProvider from "src/components/hook-form";
import { RouterLink } from "src/routes/components";
import { NewAssignmentSchema } from "./schema";
import { AssignmentDetailsSection } from "./details-section";
import { AssignmentSupervisionSection } from "./supervision-section";
import { AssignmentReportingInstructionSection } from "./reporting-instructions-section";
import { AssignmentRequirementsSection } from "./requirements-section";
import { AssignmentShiftSection } from "./shifts-section";
import { EditSection } from "../common/section";

// ----------------------------------------------------------------------

type Props = {
  eventId: string;
  currentAssignment?: Assignment;
  assignmentTemplateView?: boolean; // New prop to toggle between views
};

export default function EditAssignment({
  eventId,
  currentAssignment,
  assignmentTemplateView = false, // Default to shifts table view
}: Props) {
  const { data: eventData } = useQuery(GET_EVENT_WITH_SUPERVISOR_OVERRIDE, {
    variables: { id: eventId },
  });
  const basePath = assignmentTemplateView ? paths.dashboard.admin.overtime.templates : paths.dashboard.admin.overtime;
  const {
    lasdEventFields,
    signingAuthorityAssignment,
  } = useFeatures();
  const router = useRouter();

  const allDisabled = useMemo(() => {
    const hasInvalidStatus = [EventStatus.Removed].includes(currentAssignment?.event?.status || '' as any);
    const isRemoved = currentAssignment?.removedAt || currentAssignment?.event?.removedAt;
    return Boolean(hasInvalidStatus || isRemoved);
  }, [currentAssignment?.event?.status, currentAssignment?.event?.removedAt, currentAssignment?.removedAt]);
  const isComplete = useMemo(() => {
    if (assignmentTemplateView) return false;
    const completeStatus = currentAssignment?.event?.status === EventStatus.Complete;
    const completeEndTime = currentAssignment?.event?.endTime ? Date.now() >= new Date(currentAssignment.event.endTime).valueOf() : false;
    return completeStatus || completeEndTime;
  }, [
    assignmentTemplateView,
    currentAssignment?.event?.endTime,
    currentAssignment?.event?.status
  ]);

  const [upsertAssignment, { loading: upsertAssignmentLoading }] = useMutation(UPSERT_ASSIGNMENT, {
    refetchQueries: [GET_EVENT, GET_ASSIGNMENT],
  });

  const { enqueueSnackbar } = useSnackbar();

  const defaultValues = useMemo(
    () => ({
      id: currentAssignment?.id,
      name: currentAssignment?.name || '',
      callSign: currentAssignment?.callSign,
      description: currentAssignment?.description || '',
      attachments: [],
      eventId,
      reportingLocation: currentAssignment?.reportingLocation || '',
      bwNeeded: currentAssignment?.bwNeeded || false,
      bypassDemobilization: currentAssignment?.bypassDemobilization || false,
      notifyWhenFullyStaffed: currentAssignment?.notifyWhenFullyStaffed || false,
      requiredSkills: currentAssignment?.requiredSkills || [],
      requiredEquipment: currentAssignment?.requiredEquipment || [],
      ranks: currentAssignment?.ranks || [],
      shifts: currentAssignment?.shifts || [],
      supervisorAssignment: currentAssignment?.supervisorAssignment || null,
      lieutenantAssignment: currentAssignment?.lieutenantAssignment || null,
      fieldSupervisorAssignment: currentAssignment?.fieldSupervisorAssignment || null,
      useSupervisorAssignmentOverride: !!currentAssignment?.useSupervisorAssignmentOverride,
      useLieutenantAssignmentOverride: !!currentAssignment?.useLieutenantAssignmentOverride,
      useFieldSupervisorAssignmentOverride: !!currentAssignment?.useFieldSupervisorAssignmentOverride,
      isSigningAuthority: !!currentAssignment?.isSigningAuthority,
      allowOfficerCheckIn: currentAssignment?.allowOfficerCheckIn || false,
      geoFence: currentAssignment?.geoFence || null,
      uniform: currentAssignment?.uniform || '',
      radioFrequency: currentAssignment?.radioFrequency || '',
      reportingTime: currentAssignment?.reportingTime ? new Date(currentAssignment?.reportingTime) : null,
      briefingTime: currentAssignment?.briefingTime ? new Date(currentAssignment?.briefingTime) : null,
      assignmentDivision: currentAssignment?.assignmentDivision || null,
      assignmentGroup: currentAssignment?.assignmentGroup || null,
      branch: currentAssignment?.branch || null,
      briefingLocation: currentAssignment?.briefingLocation || '',
      includeDriveTime: 'includeDriveTime' in (currentAssignment || {}) ? currentAssignment?.includeDriveTime : true,
      reportingLocationPosition: currentAssignment?.reportingLocationDetails?.location?.latitude && currentAssignment?.reportingLocationDetails?.location?.longitude ? [currentAssignment?.reportingLocationDetails?.location?.longitude, currentAssignment?.reportingLocationDetails?.location?.latitude] : null,
      reportingLocationAddress: currentAssignment?.reportingLocationDetails?.fullAddress ? {
        id: currentAssignment?.reportingLocationDetails?.fullAddress,
        place_name: currentAssignment?.reportingLocationDetails?.fullAddress,
        place_name_en: currentAssignment?.reportingLocationDetails?.fullAddress,
      } : null,
      assignmentArea: currentAssignment?.assignmentArea || null,
      assignmentLocationPosition: currentAssignment?.assignmentLocation?.location?.latitude && currentAssignment?.assignmentLocation?.location?.longitude ? [currentAssignment?.assignmentLocation?.location?.longitude, currentAssignment?.assignmentLocation?.location?.latitude] : null,
      assignmentLocationAddress: currentAssignment?.assignmentLocation?.fullAddress ? {
        id: currentAssignment?.assignmentLocation?.fullAddress,
        place_name: currentAssignment?.assignmentLocation?.fullAddress,
        place_name_en: currentAssignment?.assignmentLocation?.fullAddress,
      } : null,
      shiftSlots: (currentAssignment?.shiftSlots || []).map((slot) => ({
        id: slot!.id,
        slotCount: slot!.slotCount,
        slotDetails: slot!.slotDetails ? omitDeep(JSON.parse(JSON.stringify(slot!.slotDetails)), ['__typename']) : new Array(slot!.slotCount || 1).fill({
          index: 0,
          callSign: null,
          customId: null,
          locked: false,
        }).map((detail, index) => ({ ...detail, index })),
      })),
    }),
    [currentAssignment, eventId]
  );

  const methods = useForm({
    resolver: yupResolver(NewAssignmentSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    getValues,
    formState: { isSubmitting },
  } = methods;

  const { isSigningAuthority } = getValues();

  useEffect(() => {
    if (currentAssignment) {
      reset(defaultValues);
    }
  }, [currentAssignment, defaultValues, reset]);

  const formSubmit = async (formData: any, {
    reroute,
  } = {
    reroute: 'assignment',
  }) => {
    try {
      let imageUploadUrls = [];
      const existingAttachments = formData.attachments
        .filter(({ existing }: any) => existing)
        .map(({ attachmentPath }: any) => {
          const url = new URL(attachmentPath);
          return {
            attachmentPath: url.pathname.replace(/^\//, "")
          };
        });
      const getUploadUrls = formData.attachments.filter(({ existing }: any) => !existing);
      if (getUploadUrls.length > 0) {
        let mutation: any = 'mutation {';
        getUploadUrls.forEach((file: any, index: number) => {
          // Use displayName if available, otherwise fall back to file.name
          const fileName = file.displayName || file.name;
          mutation += `
            attachments${index}: assignmentAttachmentUploadUrl(name: "${fileName}"${formData.id ? `, assignmentId: "${formData.id}"` : ''}) {
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

      const res = await upsertAssignment({
        variables: {
          input: {
            id: formData?.id,
            name: formData?.name,
            description: formData?.description,
            callSign: formData?.callSign,
            ...(formData?.reportingLocation?.trim() !== '' && !!formData?.reportingLocation && { reportingLocation: formData?.reportingLocation }),
            reportingLocation: formData?.reportingLocation,
            eventId,
            attachmentPaths: [
              ...existingAttachments,
              ...imageUploadUrls,
            ].map(({ attachmentPath }) => attachmentPath),
            bwNeeded: formData?.bwNeeded,
            bypassDemobilization: formData?.bypassDemobilization,
            notifyWhenFullyStaffed: formData?.notifyWhenFullyStaffed,
            requiredEquipmentIds: formData?.requiredEquipment?.map(({ id }: Equipment) => id),
            requiredSkillIds: formData?.requiredSkills?.map(({ id }: Skill) => id),
            rankIds: formData?.ranks?.map(({ id }: Rank) => id),
            shiftIds: formData?.shifts?.map(({ id }: Shift) => id),
            supervisorAssignmentId: formData?.supervisorAssignment?.id,
            lieutenantAssignmentId: formData?.lieutenantAssignment?.id,
            fieldSupervisorAssignmentId: formData?.fieldSupervisorAssignment?.id,
            isSigningAuthority: formData?.isSigningAuthority,
            allowOfficerCheckIn: formData?.allowOfficerCheckIn || false,
            includeDriveTime: formData?.includeDriveTime,
            geoFence: formData?.geoFence || null,
            useSupervisorAssignmentOverride: formData?.useSupervisorAssignmentOverride || false,
            useLieutenantAssignmentOverride: formData?.useLieutenantAssignmentOverride || false,
            useFieldSupervisorAssignmentOverride: formData?.useFieldSupervisorAssignmentOverride || false,
            uniform: formData?.uniform?.trim?.(),
            radioFrequency: formData?.radioFrequency?.trim?.(),
            reportingTime: formData?.reportingTime?.toISOString?.(),
            briefingTime: formData?.briefingTime?.toISOString?.(),
            briefingLocation: formData?.briefingLocation?.trim?.(),
            assignmentDivisionId: formData?.assignmentDivision?.id,
            assignmentGroupId: formData?.assignmentGroup?.id,
            branchId: formData?.branch?.id,
            // Only send shiftSlots if they exist to avoid overwriting existing slots with []
            ...(formData?.shiftSlots?.length > 0 ? { shiftSlots: formData?.shiftSlots } : {}),
            reportingLocationDetails: formData?.reportingLocationPosition || formData?.reportingLocationAddress ? {
              fullAddress: formData?.reportingLocationAddress?.place_name_en || '',
              ...(formData?.reportingLocationPosition && {
                location: {
                  latitude: formData?.reportingLocationPosition[1],
                  longitude: formData?.reportingLocationPosition[0],
                }
              })
            } : null,
            assignmentArea: formData?.assignmentArea || null,
            assignmentLocation: formData?.assignmentLocationPosition || formData?.assignmentLocationAddress ? {
              fullAddress: formData?.assignmentLocationAddress?.place_name_en || '',
              ...(formData?.assignmentLocationPosition && {
                location: {
                  latitude: formData?.assignmentLocationPosition[1],
                  longitude: formData?.assignmentLocationPosition[0],
                }
              })
            } : null,
          },
        },
      });

      if (reroute === 'assignment') {
        if (!currentAssignment) {
          router.push(basePath.eventAssignmentDetail
            .replace(':eventId', res.data?.assignment?.eventId)
            .replace(':assignmentId', res.data?.assignment?.id)
          );
        }
      }
      if (reroute === 'event') {
        router.push(basePath.eventDetail
          .replace(':eventId', res.data?.assignment?.eventId)
        );
      }
      return res.data?.assignment.id;
    } catch (error) {
      enqueueSnackbar('Failed to save changes. Please try again.', { variant: 'error' });
      console.error(error);
      return null;
    }
  };

  const onSubmit = handleSubmit(async (formData) => {
    await formSubmit(formData);
  });

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <AssignmentDetailsSection disabled={allDisabled} signingAuthorityAssignment={signingAuthorityAssignment} currentAssignment={currentAssignment} />
        {lasdEventFields && (
          <>
            <AssignmentSupervisionSection eventId={eventId} disabled={allDisabled} event={eventData?.event} />
            <AssignmentReportingInstructionSection disabled={allDisabled} />
          </>
        )}
        <AssignmentRequirementsSection disabled={allDisabled} isComplete={isComplete} />
        <AssignmentShiftSection
          assignmentTemplateView={assignmentTemplateView}
          isSigningAuthority={isSigningAuthority}
          disabled={allDisabled}
          isComplete={isComplete}
          eventId={eventId}
          currentAssignment={currentAssignment}
          loading={upsertAssignmentLoading}
          formSubmit={formSubmit}
        />

        <EditSection title="" description="" customCard sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <Button
            component={RouterLink}
            variant='outlined'
            size="large"
            href={basePath.eventDetail.replace(':eventId', eventId)}
          >Cancel</Button>
          <LoadingButton
            type="button"
            variant="outlined"
            size="large"
            loading={isSubmitting}
            disabled={allDisabled}
            sx={{ ml: 2 }}
            onClick={() => formSubmit(getValues(), { reroute: 'event' })}
          >
            Save & Close
          </LoadingButton>
          <LoadingButton
            type="submit"
            variant="contained"
            size="large"
            loading={isSubmitting}
            disabled={allDisabled}
            sx={{ ml: 2 }}
          >
            {!currentAssignment ? 'Create Assignment' : 'Save Changes'}
          </LoadingButton>
        </EditSection>

      </Grid>
    </FormProvider>
  );
}
