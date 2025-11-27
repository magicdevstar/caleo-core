import * as Yup from 'yup';

export const NewAssignmentSchema = Yup.object().shape({
  id: Yup.string(),
  name: Yup.string().required('Name is required'),
  callSign: Yup.string().nullable(),
  attachments: Yup.array(),
  description: Yup.string(),
  eventId: Yup.string(),
  reportingLocation: Yup.string().nullable(),
  bwNeeded: Yup.boolean(),
  notifyWhenFullyStaffed: Yup.boolean(),
  requiredSkills: Yup.array(),
  requiredEquipment: Yup.array(),
  ranks: Yup.array().min(1).required('At least one rank is required'),
  shifts: Yup.array(),
  isSigningAuthority: Yup.boolean(),
  supervisorAssignment: Yup.object().nullable(),
  lieutenantAssignment: Yup.object().nullable(),
  fieldSupervisorAssignment: Yup.object().nullable(),
  allowOfficerCheckIn: Yup.boolean().nullable(),
  bypassDemobilization: Yup.boolean(),
  geoFence: Yup.array().nullable(),
  reportingLocationPosition: Yup.array().nullable(),
  reportingLocationAddress: Yup.object().nullable(),
  assignmentArea: Yup.array().nullable(),
  assignmentLocationPosition: Yup.array().nullable(),
  assignmentLocationAddress: Yup.object().nullable(),
  reportingTime: Yup.date().nullable(),
  uniform: Yup.string().nullable(),
  radioFrequency: Yup.string().nullable(),
  briefingTime: Yup.date().nullable(),
  briefingLocation: Yup.string().nullable(),
  includeDriveTime: Yup.boolean().nullable(),
  useSupervisorAssignmentOverride: Yup.boolean().nullable(),
  useLieutenantAssignmentOverride: Yup.boolean().nullable(),
  useFieldSupervisorAssignmentOverride: Yup.boolean().nullable(),
  assignmentDivision: Yup.object().nullable(),
  assignmentGroup: Yup.object().nullable(),
  branch: Yup.object().nullable(),
  shiftSlots: Yup.array().of(
    Yup.object().shape({
      slotCount: Yup.number().positive().nullable(),
      slotDetails: Yup.array().of(
        Yup.object().shape({
          index: Yup.number(),
          callSign: Yup.string().nullable(),
          customId: Yup.string().nullable(),
          locked: Yup.boolean().default(false),
        })
      ).nullable(),
    }).nullable()
  ).nullable() as any,
});