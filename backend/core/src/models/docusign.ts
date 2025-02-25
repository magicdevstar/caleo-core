import ds, { EnvelopeDefinition, EnvelopeRecipients, Recipients, TemplateRole } from 'docusign-esign';
import { Db, ObjectId } from "mongodb";
import {
  SecretsManagerClient,
  GetSecretValueCommand
} from '@aws-sdk/client-secrets-manager'
import { BaseMongo } from "./base.v2";
import { IOrganization, OrganizationModel } from "./organization";
import { DocType } from "../__generated__/resolvers-types";
import logger from "../utils/logger";
import { IShift } from './shift';
import { IEvent } from './event';
import { IUser } from '../types/common';

const client = new ds.ApiClient();
client.setOAuthBasePath(
  process.env.DOCUSIGN_BASE!.replace('https://', '')
);
const secretsManager = new SecretsManagerClient({});
export interface IDocusign {
  _id?: ObjectId;
  id?: string;
  orgId: ObjectId;
  token: string;
  basePath: string;
  accountId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class DocusignModel extends BaseMongo<IDocusign> {
  constructor(db: Db, private organizations: OrganizationModel) {
    super(db, DocType.DsToken, 'dsTokens');
  }

  async updateAllDSOrgKeys() {
    const orgs = await this.organizations.collection.find({
      'docusign.secretKey': { $exists: true },
    }).project<IOrganization>({
      docusign: 1,
    }).toArray();

    for(const organization of orgs) {
      const {
        SecretString: privateKey
      } = await secretsManager.send(new GetSecretValueCommand({
        SecretId: organization.docusign.secretKey,
      }));
      if (!privateKey) {
        logger.warn('No secret found for organization', { organizationId: organization._id });
        continue;
      }
      const refreshValue = await client.requestJWTUserToken(
        organization.docusign.clientId,
        organization.docusign.userId,
        ['signature', 'impersonation'],
        Buffer.from(privateKey!, 'utf-8'),
        3600
      );
      const userInfo = await client.getUserInfo(refreshValue.body.access_token);
      const accountInfo = userInfo.accounts.find(account => account.isDefault === 'true');
      const token = refreshValue.body.access_token;
      const date = new Date();
      await this.collection.updateOne({
        orgId: organization._id,
      }, {
        $set: {
          token,
          basePath: `${accountInfo.baseUri}/restapi`,
          accountId: accountInfo.accountId,
          updatedAt: date,
        },
        $setOnInsert: {
          createdAt: date,
        }
      }, {
        upsert: true,
      });
    }
  }

  async createEnvelope({
    org,
    templateId,
    shift,
    event,
    user
  }: {
    org: IOrganization;
    templateId: string;
    shift: IShift;
    user: IUser;
    event: IEvent;
  }) {
    const tokenRecord = await this.get(org._id!);
    if (!tokenRecord) {
      throw new Error('No docusign token found');
    }
    client.setBasePath(tokenRecord.basePath);
    client.addDefaultHeader('Authorization', 'Bearer ' + tokenRecord.token);

    const envAPI = new ds.EnvelopesApi(client);
    const templateRoles: TemplateRole[] = [
      {
        roleName: 'officer',
        routingOrder: '1',
        email: 'danwakeem+officer@caleopro.com',
        name: 'Dan J',
      },
      {
        roleName: 'lieutenant',
        routingOrder: '2',
        email: 'danwakeem+lieutenant@gmail.com',
        name: 'Dan Jar',
      }
    ];
    const envDef: EnvelopeDefinition = {
      templateId: org.docusign.templateId,
      signerCanSignOnMobile: 'true',
      expireEnabled: 'false',
      status: 'created',
      templateRoles
    };
    const envelope = await envAPI.createEnvelope(tokenRecord.accountId, {
      envelopeDefinition: envDef,
    });

    const tabResponse = await envAPI.getDocumentTabs(tokenRecord.accountId, envelope.envelopeId!, '1');
    const tabs = (tabResponse as unknown as { prefillTabs: ds.Tabs }).prefillTabs;

    await envAPI.createDocumentTabs(tokenRecord.accountId, envelope.envelopeId!, '1', {
      prefillTabs: {
        dateTabs: [
          {
            tabId: tabs.dateTabs![0].tabId,
            tabLabel: "shiftDate",
            value: "02-20-2025"
          }
        ],
        textTabs: [
          {
            tabId: tabs.textTabs?.find((x) => x.tabLabel === 'officerName')?.tabId,
            tabLabel: "officerName",
            value: "John Doe"
          },
          {
            tabId: tabs.textTabs?.find((x) => x.tabLabel === 'officerRank')?.tabId,
            tabLabel: "officerRank",
            value: "Rank 1"
          },
          {
            tabId: tabs.textTabs?.find((x) => x.tabLabel === 'officerUnitOfAssignment')?.tabId,
            tabLabel: "officerUnitOfAssignment",
            value: "Unit 1"
          },
          {
            tabId: tabs.textTabs?.find((x) => x.tabLabel === 'officerDivision')?.tabId,
            tabLabel: "officerDivision",
            value: "Division 1"
          },
          {
            tabId: tabs.textTabs?.find((x) => x.tabLabel === 'officerEmployeeNumber')?.tabId,
            tabLabel: "officerEmployeeNumber",
            value: "1234567890"
          },
          {
            tabId: tabs.textTabs?.find((x) => x.tabLabel === 'shiftHours')?.tabId,
            tabLabel: "shiftHours",
            value: "3"
          },
          {
            tabId: tabs.textTabs?.find((x) => x.tabLabel === 'checkinTime')?.tabId,
            tabLabel: "checkinTime",
            value: "12:30"
          },
          {
            tabId: tabs.textTabs?.find((x) => x.tabLabel === 'checkoutTime')?.tabId,
            tabLabel: "checkoutTime",
            value: "15:30"
          },
          {
            tabId: tabs.textTabs?.find((x) => x.tabLabel === 'ocn')?.tabId,
            tabLabel: "ocn",
            value: "ocn-123"
          },
          {
            tabId: tabs.textTabs?.find((x) => x.tabLabel === 'incidentCommanderName')?.tabId,
            tabLabel: "incidentCommanderName",
            value: "Josh Smith"
          },
          {
            tabId: tabs.textTabs?.find((x) => x.tabLabel === 'incidentCommanderEmployeeNumber')?.tabId,
            tabLabel: "incidentCommanderEmployeeNumber",
            value: "09876"
          },
          {
            tabId: tabs.textTabs?.find((x) => x.tabLabel === 'lieutenantEmployeeNumber')?.tabId,
            tabLabel: "lieutenantEmployeeNumber",
            value: "45678765"
          },
          {
            tabId: tabs.textTabs?.find((x) => x.tabLabel === 'orgId')?.tabId,
            tabLabel: "orgId",
            value: '64cd5e262c436093a2b7e680'
          },
          {
            tabId: tabs.textTabs?.find((x) => x.tabLabel === 'shiftId')?.tabId,
            tabLabel: "shiftId",
            value: '67ac2f38f621acf75308c5a4'
          }
        ]
      }
    });

    await envAPI.update(tokenRecord.accountId, envelope.envelopeId!, {
      envelope: {
        status: 'sent',
      }
    });

    // TODO: Save envelopId to shift
  }
}