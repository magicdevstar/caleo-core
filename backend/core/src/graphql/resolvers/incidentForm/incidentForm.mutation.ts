import { GraphQLError } from 'graphql';
import { IncidentFormResponse } from '../../../__generated__/resolvers-types';
import { InputIncidentForm } from '../../../models/incidentForm';
import { Context } from '../../../utils/createContext';
import logger from '../../../utils/logger';
import { adminOrOwnerOnly } from '../../../utils/access';

export const Mutation = {
  voidIncidentForm: async (
    _: unknown,
    { id, voidReason }: { id: string; voidReason?: string },
    { incidentSubmissionModel, docusign, user, organization }: Context,
  ): Promise<boolean> => {
    // Fetch the incident form for permission check
    const incidentForm = await incidentSubmissionModel.get(id);
    if (!incidentForm) {
      throw new GraphQLError('Incident form not found');
    }

    // Check permissions
    adminOrOwnerOnly(incidentForm.userId.toHexString(), user);

    // Void the incident form via the docusign service
    try {
      await docusign.voidIncidentForm({
        incidentFormId: id,
        voidReason,
        org: organization,
        userId: user._id!,
      });
      return true;
    } catch (error) {
      const e = error as Error;
      logger.error('Error voiding incident form:', { error });
      throw new GraphQLError(e.message || 'Failed to void incident form');
    }
  },
  incidentForm: async (
    _: unknown,
    { input, saveOnly, resubmit }: { input: InputIncidentForm, saveOnly?: boolean, resubmit: boolean },
    { user, organization, docusign }: Context,
  ): Promise<IncidentFormResponse> => {
    try {
      const res = await docusign.submitIncidentForm({
        saveOnly: !!saveOnly,
        resubmit,
        incidentForm: {
          ...input,
          isMutualAid: !!input.isMutualAid,
          modifiedById: user._id!,
          userId: user._id!,
          orgId: user.member.orgId,
        },
        user,
        org: organization,
      });
      return res;
    } catch(error) {
      const e = error as Error;
      if (
        e.message === 'An incident form already exists for this event and date' ||
        e.message.includes('overlapping time range already exists') ||
        e.message.includes('Missing required time field')
      ) {
        throw new GraphQLError(e.message);
      }
      logger.error('Error in incidentForm mutation:', { error });
      throw new GraphQLError('Failed to save incident form');
    }
  },
  removeIncidentForm: async (
    _: unknown,
    { id }: { id: string },
    { incidentSubmissionModel, user }: Context,
  ): Promise<string> => {
    const incidentForm = await incidentSubmissionModel.get(id);
    if (!incidentForm) {
      throw new GraphQLError('Incident form not found');
    }
    adminOrOwnerOnly(incidentForm.userId.toHexString(), user);
    await incidentSubmissionModel.remove(id);
    return id;
  }
};
