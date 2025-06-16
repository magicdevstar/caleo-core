import { IncidentFormSearchInput } from '../../../__generated__/resolvers-types';
import { IIncidentForm } from '../../../models/incidentForm';
import { SearchResults } from '../../../utils/common.resolvers';
import { Context } from '../../../utils/createContext';

export const Query = {
  incidentForms: async (
    _parent: any,
    { input }: { input: IncidentFormSearchInput },
    { user, incidentSubmissionModel }: Context
  ): Promise<SearchResults<IIncidentForm>> => incidentSubmissionModel.search({
    ...input,
    userId: user?._id,
  }),
};
