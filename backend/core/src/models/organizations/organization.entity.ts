import { ObjectId } from "mongodb";
import { Organization } from "../../__generated__/resolvers-types";

export interface IOrganization extends Omit<
  Organization,
  'id' |
  'createdAt' |
  'updatedAt' |
  'removedAt' |
  'modifiedById' |
  'modifiedBy' |
  'fromEmail' |
  'orgId' |
  'org' |
  '__typename'
> {
  _id?: ObjectId;
  id: string;
  orgId: ObjectId;
  modifiedById: ObjectId;
  fromEmail: string;
  docusign: {
    hmac: string;
    clientId: string;
    userId: string;
    secretKey: string;
    templateId: string;
    reserveTemplateId: string;
  }

  createdAt: Date;
  updatedAt: Date;
  removedAt?: Date;
};
