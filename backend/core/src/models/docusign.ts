import ds, { EnvelopeDefinition, TemplateRole } from 'docusign-esign';
import { Db, ObjectId } from "mongodb";
import { utcToZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';
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
import { IRank } from './rank';
import { IUnit } from './unit';
import { IIVenue } from './venue';
import { docusignDates } from '../utils/date.helpers';

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

  async createLASDShiftEnvelope({
    org,
    shift,
    event,
    venue,
    user,
    userRank,
    unit,
    supervisor,
    lieutenant,
    signNow,
  }: {
    org: IOrganization;
    shift: IShift;
    user: IUser;
    venue: IIVenue;
    userRank: IRank;
    unit: IUnit;
    supervisor: IUser;
    lieutenant: IUser;
    event: IEvent;
    signNow: boolean,
  }) {
    const tokenRecord = await this.collection.findOne({
      orgId: org._id,
    });
    if (!tokenRecord) {
      throw new Error('No docusign token found');
    }
    client.setBasePath(tokenRecord.basePath);
    client.addDefaultHeader('Authorization', 'Bearer ' + tokenRecord.token);

    const clientUserId = '1001';

    const isReserve = userRank.name.toLowerCase().includes('deputy, reserve');
    const templateId = isReserve ? org.docusign.reserveTemplateId : org.docusign.templateId;

    const envAPI = new ds.EnvelopesApi(client);
    const templateRoles: TemplateRole[] = [
      {
        roleName: 'officer',
        routingOrder: '1',
        email: user.member.contactInfo?.primaryEmail.address,
        name: user.name,
        ...(signNow && { clientUserId }),
      },
      {
        roleName: 'lieutenant',
        routingOrder: '2',
        email: lieutenant.member.contactInfo?.primaryEmail.address,
        name: lieutenant.name,
      },
      ...(isReserve ? [
        {
          roleName: 'supervisor',
          routingOrder: '3',
          email: supervisor.member.contactInfo?.primaryEmail.address,
          name: supervisor.name,
        }
      ] : []),
    ];
    const envDef: EnvelopeDefinition = {
      templateId,
      expireEnabled: 'false',
      status: 'created',
      templateRoles,
      customFields: {
        textCustomFields: [
          {
            name: 'shiftId',
            value: shift._id!.toString(),
          },
          {
            name: 'orgId',
            value: org._id!.toString(),
          }
        ]
      }
    };
    const envelope = await envAPI.createEnvelope(tokenRecord.accountId, {
      envelopeDefinition: envDef,
    });

    const tabResponse = await envAPI.getDocumentTabs(tokenRecord.accountId, envelope.envelopeId!, '1');
    const tabs = (tabResponse as unknown as { prefillTabs: ds.Tabs }).prefillTabs;

    const {
      startTime,
      endTime,
      formattedDiff,
    }  = docusignDates({
      startTime: shift.shiftCheckInOut!.checkInTime!,
      endTime: shift.shiftCheckInOut!.checkOutTime!,
      startEquipmentTime: shift.shiftCheckInOut!.checkInEquipmentTime || undefined,
      endEquipmentTime: shift.shiftCheckInOut!.checkOutEquipmentTime || undefined,
      timezone: org.timezone as any,
    });

    const totalEquipmentTime = Math.round((shift.shiftCheckInOut!.checkInEquipmentTime || 0) + (shift.shiftCheckInOut!.checkOutEquipmentTime || 0));
    const lastLineExplainer =
      totalEquipmentTime ?
      `Employee received a total of ${totalEquipmentTime} hours of equipment time.` :
      'Employee received a total of 1 hour of travel time.'

    const prefillTabs = {
      tabs: {
        prefillTabs: {
          dateTabs: [
            {
              tabId: tabs.dateTabs![0].tabId,
              tabLabel: "shiftDate",
              value: format(startTime, 'MM/dd/yyyy')
            }
          ],
          textTabs: [
            {
              tabId: tabs.textTabs?.find((x) => x.tabLabel === 'officerName')?.tabId,
              tabLabel: "officerName",
              value: `${user.lastName} ${user.firstName}`
            },
            {
              tabId: tabs.textTabs?.find((x) => x.tabLabel === 'officerRank')?.tabId,
              tabLabel: "officerRank",
              value: userRank.name,
            },
            {
              tabId: tabs.textTabs?.find((x) => x.tabLabel === 'officerUnitOfAssignment')?.tabId,
              tabLabel: "officerUnitOfAssignment",
              value: unit.name,
            },
            {
              tabId: tabs.textTabs?.find((x) => x.tabLabel === 'outsideOrgCode')?.tabId,
              tabLabel: "outsideOrgCode",
              value: event.outsideOrgCode || 'outsideOrgCode123'
            },
            {
              tabId: tabs.textTabs?.find((x) => x.tabLabel === 'officerEmployeeNumber')?.tabId,
              tabLabel: "officerEmployeeNumber",
              value: user.member.pNumber
            },
            {
              tabId: tabs.textTabs?.find((x) => x.tabLabel === 'shiftHours')?.tabId,
              tabLabel: "shiftHours",
              value: formattedDiff,
            },
            {
              tabId: tabs.textTabs?.find((x) => x.tabLabel === 'checkinTime')?.tabId,
              tabLabel: "checkinTime",
              value: format(startTime, 'HH:mm')
            },
            {
              tabId: tabs.textTabs?.find((x) => x.tabLabel === 'checkoutTime')?.tabId,
              tabLabel: "checkoutTime",
              value: format(endTime, 'HH:mm')
            },
            {
              tabId: tabs.textTabs?.find((x) => x.tabLabel === 'ocn')?.tabId,
              tabLabel: "ocn",
              value: event.ocn
            },
            {
              tabId: tabs.textTabs?.find((x) => x.tabLabel === 'incidentCommanderName')?.tabId,
              tabLabel: "incidentCommanderName",
              value: supervisor.name
            },
            {
              tabId: tabs.textTabs?.find((x) => x.tabLabel === 'incidentCommanderEmployeeNumber')?.tabId,
              tabLabel: "incidentCommanderEmployeeNumber",
              value: supervisor.member.pNumber,
            },
            {
              tabId: tabs.textTabs?.find((x) => x.tabLabel === 'lieutenantEmployeeNumber')?.tabId,
              tabLabel: "lieutenantEmployeeNumber",
              value: lieutenant.member.pNumber,
            },
            {
              tabId: tabs.textTabs?.find((x) => x.tabLabel === 'orgId')?.tabId,
              tabLabel: "orgId",
              value: org._id!.toString()
            },
            {
              tabId: tabs.textTabs?.find((x) => x.tabLabel === 'shiftId')?.tabId,
              tabLabel: "shiftId",
              value: shift._id!.toString()
            },
            {
              tabId: tabs.textTabs?.find((x) => x.tabLabel === 'overtimeReasonCode')?.tabId,
              tabLabel: "overtimeReasonCode",
              value: event.overtimeReasonCode || '301'
            },
            {
              tabId: tabs.textTabs?.find((x) => x.tabLabel === 'budgetActivityCode')?.tabId,
              tabLabel: "budgetActivityCode",
              value: event.budgetActivityCode || 'DN6S'
            },
            {
              tabId: tabs.textTabs?.find((x) => x.tabLabel === 'automaticDetails')?.tabId,
              tabLabel: "automaticDetails",
              value: `Worked ${event.name} @ ${venue.address || 'ADDRESS'} ${venue.city || 'CITY'} in the ${venue.contract?.name || 'N/A'}.\nSpecial Event Contract: ${venue.contract?.name || 'N/A'}.\n${lastLineExplainer}`,
            }
          ]
        }
      }
    };

    await envAPI.updateDocumentTabs(tokenRecord.accountId, envelope.envelopeId!, '1', prefillTabs);

    await envAPI.update(tokenRecord.accountId, envelope.envelopeId!, {
      mergeRolesOnDraft: true,
      envelope: {
        status: 'sent'
      }
    });

    let signingUrl;
    if (signNow) {
      const domain = org.sso?.uiSubDomains?.[0]!;
      const baseDomain = `https://${domain}.caleopro.com`;
      const viewRequest = {
        returnUrl: `${baseDomain}/dashboard`,
        authenticationMethod: 'none',
        email: user.member.contactInfo?.primaryEmail.address,
        userName: user.name,
        clientUserId,
        frameAncestors: [baseDomain],
        messageOrigins: [baseDomain]
      };
      const recipientView = await envAPI.createRecipientView(tokenRecord.accountId, envelope.envelopeId!, { recipientViewRequest: viewRequest });
      signingUrl = recipientView.url!;
    }

    return {
      signingUrl,
      envelopeId: envelope.envelopeId!
    };
  }

  async getDocument({
    envelopeId,
    orgId,
  }: {
    envelopeId: string;
    orgId: string;
  }): Promise<string> {
    const tokenRecord = await this.collection.findOne({
      orgId: new ObjectId(orgId),
    });
    if (!tokenRecord) {
      throw new Error('No docusign token found');
    }
    client.setBasePath(tokenRecord.basePath);
    client.addDefaultHeader('Authorization', 'Bearer ' + tokenRecord.token);

    const envAPI = new ds.EnvelopesApi(client);
    return (envAPI.getDocument as any)(
      tokenRecord.accountId,
      envelopeId,
      '1',
      null
    );
  }
}