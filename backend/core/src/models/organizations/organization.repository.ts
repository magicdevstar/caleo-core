import { Db } from "mongodb";
import { BaseMongo } from "../base.v2";
import { IOrganization } from "./organization.entity";
import { DocType, UpsertOrganization } from "../../__generated__/resolvers-types";
import logger from "../../utils/logger";

export class OrganizationRepo extends BaseMongo<IOrganization> {
  constructor(db: Db) {
    super(db, DocType.Organization, 'organizations');
  }

  public async getOrganizationSSOConfig(subdomain: string): Promise<IOrganization | null> {
    const org = await this.collection.findOne<IOrganization>({ 'sso.uiSubDomains': subdomain });
    return org;
  }

  public async getBySSOAppName(uiSubDomains: string): Promise<IOrganization | null> {
    const org = await this.collection.findOne<IOrganization>({ 'sso.uiSubDomains': uiSubDomains });
    return org;
  }

  public async create(org: any): Promise<any> {
    const inputOrg = org as UpsertOrganization;
    const now = new Date();
    const insertDoc = {
      ...inputOrg,
      docType: DocType.Organization,
      createdAt: now,
      updatedAt: now,
    };
    const res = await this.collection.insertOne(insertDoc);
    const organization = {
      id: res.insertedId.toString(),
      ...insertDoc,
      createdAt: insertDoc.createdAt as any,
      updatedAt: insertDoc.updatedAt as any,
    };

    logger.info('Organization created', { res, organization });

    return organization as IOrganization;
  }
};
