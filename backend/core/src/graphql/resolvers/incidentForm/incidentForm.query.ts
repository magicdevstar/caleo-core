import { IncidentFormSearchInput } from '../../../__generated__/resolvers-types';
import { IIncidentForm } from '../../../models/incidentForm';
import { userIsAdmin } from '../../../utils/access';
import { SearchResults } from '../../../utils/common.resolvers';
import { Context } from '../../../utils/createContext';

export const Query = {
  incidentForms: async (
    _parent: any,
    { input, report }: { input: IncidentFormSearchInput, report?: boolean },
    { user, incidentSubmissionModel }: Context
  ): Promise<SearchResults<IIncidentForm>> => {
    let userId = user?._id;
    if (report && userIsAdmin(user)) {
      // If the user is an admin and requesting a report, we don't filter by userId
      userId = undefined;
    } 

    return incidentSubmissionModel.search({
      ...input,
      userId,
    });
  },
};
