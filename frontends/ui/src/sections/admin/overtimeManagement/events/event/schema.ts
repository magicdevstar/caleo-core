import * as Yup from 'yup';
import {
  Venue,
} from 'src/__generated__/resolvers-types';

export const NewEventSchema = Yup.object().shape({
  id: Yup.string(),
  name: Yup.string().required('Name is required'),
  status: Yup.string(),
  notes: Yup.string(),
  attachments: Yup.array(),
  notifyWhenFullyStaffed: Yup.boolean(),
  lotteryNumber: Yup.number().nullable(),
  startTime: Yup.date().optional(),
  endTime: Yup.date().optional(),
  venueId: Yup.mixed<Venue | string>()
    .nullable()
    .transform((value: Venue) => value?.id),
  scheduledFirstComeFirstServe: Yup.string(),
  scheduledInterestList: Yup.string(),
  autoAssignInterestList: Yup.boolean().nullable(),
  scheduledCloseInterestList: Yup.string(),
  createdById: Yup.string(),
  assignments: Yup.array(),
  requiredSkills: Yup.array(),
  allowOfficerCheckIn: Yup.boolean().nullable(),
  geoFence: Yup.array().nullable(),
  reportingLocationPosition: Yup.array().nullable(),
  reportingLocationAddress: Yup.object().nullable(),
  notifyOnFirstComeFirstServe: Yup.boolean(),
  outsideOrgCode: Yup.string().nullable(),
  overtimeReasonCode: Yup.string().nullable(),
  budgetActivityCode: Yup.string().nullable(),
  supervisorAssignment: Yup.object().nullable(),
  lieutenantAssignment: Yup.object().nullable(),
  fieldSupervisorAssignment: Yup.object().nullable(),
  interestListAutoAssignCutoff: Yup.string().nullable(),
  overtimeNarrative: Yup.string().nullable(),
  thumbnail: Yup.mixed().nullable(),
  bodyWarnTag: Yup.string().nullable(),
  commandPostContactNumber: Yup.string().nullable(),
  uniform: Yup.string().nullable(),
  radioFrequency: Yup.string().nullable(),
  reportingTime: Yup.date().nullable(),
  briefingTime: Yup.date().nullable(),
  overrideSupervisor: Yup.object().nullable(),
  briefingLocation: Yup.string().nullable(),
  ocn: Yup
    .string()
    .nullable()
    .notRequired()
    .when('ocn', {
        is: (value: string) => value?.length,
        then: (rule) => rule.test('len', 'Must be exactly 10 characters', (val) => (val || '').length === 10),
    }),
}, [['ocn', 'ocn']]);
