import { ObjectId } from 'mongodb';
import { IncidentFormSearchInput, IncidentFormStatus } from '../../../__generated__/resolvers-types';
import { IIncidentForm } from '../../../models/incidentForm';
import { userIsAdmin } from '../../../utils/access';
import { SearchResults } from '../../../utils/common.resolvers';
import { Context } from '../../../utils/createContext';

export const Query = {
  incidentForm: async (
    _parent: any,
    { id }: { id: ObjectId },
    { incidentSubmissionModel, user }: Context
  ): Promise<IIncidentForm | null> => {
    if (userIsAdmin(user)) {
      return incidentSubmissionModel.get(id);
    }
    return incidentSubmissionModel.findUserSubmission(user!._id!, id);
  },
  incidentForms: async (
    _parent: any,
    { input: { submittedDate, status, ...input }, report }: { input: IncidentFormSearchInput, report?: boolean },
    { user, incidentSubmissionModel }: Context
  ): Promise<SearchResults<IIncidentForm>> => {
    let userId = user?._id;
    if (report && userIsAdmin(user)) {
      userId = input.userId;
      if (submittedDate) {
        (input as any).submittedDate = {
          $lte: submittedDate.lte,
          $gte: submittedDate.gte,
        }
      }
    }

    return incidentSubmissionModel.search({
      ...input,
      ...(status === IncidentFormStatus.Submitted ? { envelopeId: { $exists: true } } : {}),
      ...(userId && { userId }),
    });
  },
};
