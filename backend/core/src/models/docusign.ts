import https from 'https';
import ds, { EnvelopeDefinition, TemplateRole, Document as DSDocument, Signer, SignHere, Tabs, Recipients, Text } from 'docusign-esign';
import { Db, ObjectId } from "mongodb";
import { format } from 'date-fns';
import {
  SecretsManagerClient,
  GetSecretValueCommand
} from '@aws-sdk/client-secrets-manager'
import { BaseMongo } from "./base.v2";
import { DocType } from "../__generated__/resolvers-types";
import logger from "../utils/logger";
import { IShift } from './shift';
import { IEvent } from './event';
import { IUser } from '../types/common';
import { IRank } from './rank';
import { IUnit } from './unit';
import { IIVenue } from './venue';
import { docusignDates } from '../utils/date.helpers';
import { OrganizationRepo } from './organizations/organization.repository';
import { IOrganization } from './organizations/organization.entity';
import { IAssignment } from './assignment';

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
export interface ITokenRecord {
  _id: ObjectId;
  orgId: ObjectId;
  token: string;
  basePath: string;
  accountId: string;
  updatedAt: Date;
}

export class DocusignModel extends BaseMongo<IDocusign> {
  constructor(db: Db, private organizations: OrganizationRepo) {
    super(db, DocType.DsToken, 'dsTokens');
  }

  async updateAllDSOrgKeys() {
    const orgs = await this.organizations.collection.find({
      'docusign.secretKey': { $exists: true },
    }).project<IOrganization>({
      docusign: 1,
    }).toArray();

    for(const organization of orgs) {
      try {
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
        const accountInfo = userInfo.accounts.find(account => organization.docusign.accountName === account.accountName);
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
      } catch(error) {
        console.error('Error updating docusign token', {
          error,
          organizationId: organization._id,
        });
      }
    }
  }

  async initDocusignEnvelopeAPI({
    org,
  } : {
    org: IOrganization;
  }) {
    const tokenRecord = await this.collection.findOne<ITokenRecord>({
      orgId: org._id,
    });
    if (!tokenRecord) {
      throw new Error('No docusign token found');
    }
    client.setBasePath(tokenRecord.basePath);
    client.addDefaultHeader('Authorization', 'Bearer ' + tokenRecord.token);

    const envAPI = new ds.EnvelopesApi(client);
    return {
      tokenRecord,
      envAPI
    }
  }

  async voidEnvelope({
    envAPI,
    tokenRecord,
    envelopeId,
    org,
  }: {
    tokenRecord?: ITokenRecord;
    envAPI?: ds.EnvelopesApi,
    envelopeId: string;
    org: IOrganization;
  }) {
    if (!envAPI || !tokenRecord) {
      const { envAPI: newEnvAPI, tokenRecord: newTokenRecord } = await this.initDocusignEnvelopeAPI({
        org,
      });
      envAPI = newEnvAPI;
      tokenRecord = newTokenRecord;
    }
    await envAPI.update(tokenRecord.accountId, envelopeId!, {
      envelope: {
        status: 'voided',
        voidedReason: 'Resubmitting the envelope',
      }
    });
  }

  async updateLASDPrefilledTabs({
    org,
    shift,
    event,
    venue,
    user,
    userRank,
    unit,
    supervisor,
    lieutenant,
    envAPI,
    tokenRecord,
    envelopeId,
  }: {
    tokenRecord?: ITokenRecord;
    envAPI?: ds.EnvelopesApi,
    envelopeId: string;
    org: IOrganization;
    shift: IShift;
    user: IUser;
    venue: IIVenue;
    userRank: IRank;
    unit: IUnit;
    supervisor: IUser;
    lieutenant: IUser;
    event: IEvent;
  }) {
    if (!envAPI || !tokenRecord) {
      const { envAPI: newEnvAPI, tokenRecord: newTokenRecord } = await this.initDocusignEnvelopeAPI({
        org,
      });
      envAPI = newEnvAPI;
      tokenRecord = newTokenRecord;
    }
    const tabResponse = await envAPI.getDocumentTabs(tokenRecord.accountId, envelopeId!, '1');
    const tabs = (tabResponse as unknown as { prefillTabs: ds.Tabs }).prefillTabs;

    const {
      startTime,
      endTime,
      formattedDiff,
      totalEquipmentTime,
    }  = docusignDates({
      startTime: shift.shiftCheckInOut!.checkInTime!,
      endTime: shift.shiftCheckInOut!.checkOutTime!,
      startEquipmentTime: shift.shiftCheckInOut!.equipmentDetails?.checkInTime,
      endEquipmentTime: shift.shiftCheckInOut!.equipmentDetails?.checkOutTime,
      timezone: org.timezone as any,
    });

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
              value: format(startTime!, 'MM/dd/yyyy')
            }
          ],
          textTabs: [
            {
              tabId: tabs.textTabs?.find((x) => x.tabLabel === 'officerName')?.tabId,
              tabLabel: "officerName",
              value: `${user.lastName}, ${user.firstName}`
            },
            {
              tabId: tabs.textTabs?.find((x) => x.tabLabel === 'officerRank')?.tabId,
              tabLabel: "officerRank",
              value: userRank.name,
            },
            {
              tabId: tabs.textTabs?.find((x) => x.tabLabel === 'officerUnitOfAssignment')?.tabId,
              tabLabel: "officerUnitOfAssignment",
              value: unit.overtimeCode || '-',
            },
            {
              tabId: tabs.textTabs?.find((x) => x.tabLabel === 'outsideOrgCode')?.tabId,
              tabLabel: "outsideOrgCode",
              value: event.outsideOrgCode || '15778'
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
              value: format(startTime!, 'HHmm')
            },
            {
              tabId: tabs.textTabs?.find((x) => x.tabLabel === 'checkoutTime')?.tabId,
              tabLabel: "checkoutTime",
              value: format(endTime!, 'HHmm')
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

    const res = await envAPI.updateDocumentTabs(tokenRecord.accountId, envelopeId!, '1', prefillTabs);
    logger.info('Updated docusign tabs', {
      res
    });
  }
  
  async generateTabs({
    org,
    shift,
    event,
    assignment,
    venue,
    user,
    userRank,
    unit,
    supervisor,
    lieutenant,
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
    assignment: IAssignment;
  }) {
    // Download the tabs
    const url = `https://caleo-assets-${process.env.STAGE}.s3.us-west-2.amazonaws.com/${org.id}/shift-close/tabs.json`;
    const tabConfig: ds.Text[] = await (() => new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (error: unknown) {
            reject(new Error('Error parsing JSON: ' + (error as Error).message));
          }
        });
      }).on('error', (err: Error) => {
        reject(new Error('Error downloading file: ' + err.message));
      });
    }))();

    const {
      startTime,
      endTime,
      formattedDiff,
      totalEquipmentTime,
    }  = docusignDates({
      startTime: shift.shiftCheckInOut?.checkInTime,
      endTime: shift.shiftCheckInOut?.checkOutTime,
      startEquipmentTime: shift.shiftCheckInOut?.equipmentDetails?.checkInTime,
      endEquipmentTime: shift.shiftCheckInOut?.equipmentDetails?.checkOutTime,
      timezone: org.timezone as any,
    });

    const lastLineExplainer =
      totalEquipmentTime ?
      `Employee received a total of ${totalEquipmentTime} hours of equipment time.` :
      'Employee received a total of 1 hour of travel time.';

    const res: Record<string, any> = {};
    for(const tab of tabConfig) {
      if (tab.tabLabel === 'shiftDate') {
        res[tab.tabLabel] = startTime ? format(startTime, 'MM/dd/yyyy') : '';
      } else if (tab.tabLabel === 'officerName') {
        res[tab.tabLabel] = `${user.lastName}, ${user.firstName}`;
      } else if (tab.tabLabel === 'officerRank') {
        res[tab.tabLabel] = userRank?.name || '';
      } else if (tab.tabLabel === 'officerUnitOfAssignment') {
        res[tab.tabLabel] = unit?.overtimeCode || '';
      } else if (tab.tabLabel === 'outsideOrgCode') {
        res[tab.tabLabel] = event.outsideOrgCode || '15778';
      } else if (tab.tabLabel === 'officerEmployeeNumber') {
        res[tab.tabLabel] = user?.member?.pNumber || '';
      } else if (tab.tabLabel === 'shiftHours') {
        res[tab.tabLabel] = formattedDiff;
      } else if (tab.tabLabel === 'checkinTime') {
        res[tab.tabLabel] = startTime ? format(startTime, 'HHmm') : '';
      } else if (tab.tabLabel === 'checkoutTime') {
        res[tab.tabLabel] = endTime ? format(endTime, 'HHmm') : '';
      } else if (tab.tabLabel === 'ocn') {
        res[tab.tabLabel] = event.ocn;
      } else if (tab.tabLabel === 'incidentCommanderName') {
        res[tab.tabLabel] = supervisor?.name || '';
      } else if (tab.tabLabel === 'incidentCommanderEmployeeNumber') {
        res[tab.tabLabel] = supervisor?.member?.pNumber || '';
      } else if (tab.tabLabel === 'lieutenantEmployeeNumber') {
        res[tab.tabLabel] = lieutenant?.member?.pNumber || '';
      } else if (tab.tabLabel === 'orgId') {
        res[tab.tabLabel] = org._id!.toString();
      } else if (tab.tabLabel === 'shiftId') {
        res[tab.tabLabel] = shift._id!.toString();
      } else if (tab.tabLabel === 'overtimeReasonCode') {
        res[tab.tabLabel] = event.overtimeReasonCode || '301';
      } else if (tab.tabLabel === 'budgetActivityCode') {
        res[tab.tabLabel] = event.budgetActivityCode || 'DN6S';
      } else if (tab.tabLabel === 'automaticDetails') {
        res[tab.tabLabel] = `Worked ${event.name} @ ${venue.address || 'UNKNOWN VENUE'} ${venue.city || 'UNKNOWN CITY'} in the ${venue.contract?.name || 'N/A'}.\nSpecial Event Contract: ${venue.contract?.name || 'N/A'}.\n${lastLineExplainer}`;
      } else if (tab.tabLabel === 'callSignLabel') {
        res[tab.tabLabel] = 'Call Sign: ';
      } else if (tab.tabLabel === 'callSign') {
        res[tab.tabLabel] = shift.callSign || assignment.callSign || 'N/A';
      }
    }

    return res;
  }

  async createLASDShiftEnvelope({
    org,
    shift,
    assignment,
    event,
    venue,
    user,
    userRank,
    unit,
    supervisor,
    lieutenant,
    signNow,
    requiresVehicleInformation,
  }: {
    assignment?: IAssignment | null;
    org: IOrganization;
    shift: IShift;
    user: IUser;
    venue: IIVenue;
    userRank: IRank;
    unit: IUnit;
    supervisor: IUser;
    lieutenant: IUser;
    event: IEvent;
    signNow: boolean;
    requiresVehicleInformation: boolean;
  }) {
    const {
      envAPI,
      tokenRecord,
    } = await this.initDocusignEnvelopeAPI({
      org,
    });
    const clientUserId = '1001';

    const isReserve = userRank.name.toLowerCase().includes('deputy, reserve');
    const templateId = isReserve ? org.docusign.reserveTemplateId : org.docusign.templateId;

    const baseEmailSubject = `Overtime Worked Report - ${event.name}`;

    const templateRoles: TemplateRole[] = [
      {
        roleName: 'officer',
        routingOrder: '1',
        email: user.member.contactInfo?.primaryEmail.address,
        name: user.name,
        emailNotification: {
          emailSubject: `${baseEmailSubject} - ${user.name}`,
        },
        ...(signNow && { clientUserId }),
        tabs: {
          textTabs: [
            {
              tabLabel: 'requiredVehicleInformation',
              value: requiresVehicleInformation ? 'true' : 'false',
            },
            ...((shift.callSign || assignment?.callSign) ? [{
              tabLabel: 'callSign',
              value: shift.callSign || assignment?.callSign || '',
            }] : []),
          ],
        },
      },
      {
        roleName: 'lieutenant',
        routingOrder: '2',
        email: lieutenant.member.contactInfo?.primaryEmail.address,
        name: lieutenant.name,
        emailNotification: {
          emailSubject: `${baseEmailSubject} - ${lieutenant.name}`,
        }
      },
      ...(isReserve ? [
        {
          roleName: 'supervisor',
          routingOrder: '3',
          email: supervisor.member.contactInfo?.primaryEmail.address,
          name: supervisor.name,
          emailNotification: {
            emailSubject: `${baseEmailSubject} - ${supervisor.name}`,
          }
        }
      ] : []),
    ];
    const envDef: EnvelopeDefinition = {
      templateId,
      expireEnabled: 'false',
      status: 'created',
      templateRoles,
      emailSubject: `Overtime Worked Report - ${event.name}`,
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

    await this.updateLASDPrefilledTabs({
      org,
      shift,
      event,
      venue,
      user,
      userRank,
      unit,
      supervisor,
      lieutenant,
      envAPI,
      tokenRecord,
      envelopeId: envelope.envelopeId!,
    });

    await envAPI.update(tokenRecord.accountId, envelope.envelopeId!, {
      mergeRolesOnDraft: true,
      envelope: {
        status: 'sent'
      }
    });

    let signingUrl;
    if (signNow) {
      const domain = org.sso?.uiSubDomains?.[0];
      const baseDomain = `https://${domain}.caleopro.com`;
      // const baseDomain = 'http://192.168.4.150:3000';
      const viewRequest = {
        returnUrl: `${baseDomain}/kiosk/${event._id}`,
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
    documentId = '1',
  }: {
    envelopeId: string;
    orgId: string;
    documentId?: string;
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
      documentId,
      null
    );
  }

  async createInvoiceEnvelope({
    org,
    eventId,
    invoice,
    user,
  }: {
    org: IOrganization;
    eventId: string;
    invoice: string;
    user: IUser;
  }) {
    const {
      envAPI,
      tokenRecord,
    } = await this.initDocusignEnvelopeAPI({
      org,
    });
    const clientUserId = '1001';

    const doc: DSDocument = {
      documentBase64: Buffer.from(invoice).toString('base64'),
      name: 'Invoice',
      fileExtension: 'html',
      documentId: '1',
    };

    const orgTab: Text = {
      anchorString: '###ORG_ID###',
      anchorXOffset: '0',
      anchorYOffset: '0',
      anchorUnits: 'pixels',
      value: org._id!.toString(),
      locked: 'true',
      tabLabel: 'orgId',
      tabId: 'orgId',
      fontColor: 'White',
    };
    const eventTab: Text = {
      tabId: 'eventId',
      tabLabel: 'eventId',
      anchorString: '###EVENT_ID###',
      anchorXOffset: '0',
      anchorYOffset: '0',
      anchorUnits: 'pixels',
      value: eventId,
      fontColor: 'White',
      locked: 'true',
    };
    const signHere: SignHere = {
      anchorString: '###SIGN_HERE###',
      anchorXOffset: '0',
      anchorYOffset: '0',
      anchorUnits: 'pixels',
    };
    const tabs: Tabs = {
      signHereTabs: [signHere],
      textTabs: [
        orgTab,
        eventTab,
      ],
    };
    const signer: Signer = {
      email: user.member.contactInfo?.primaryEmail.address,
      name: user.name,
      recipientId: '1',
      routingOrder: '1',
      clientUserId,
      tabs,
    };

    const recipients: Recipients = {
      signers: [signer],
    };

    const envDef: EnvelopeDefinition = {
      emailSubject: 'St. Petersburg Police Department Invoice',
      emailBlurb: 'Please sign the invoice',
      status: 'sent',
      documents: [doc],
      recipients,
    };

    const envelope = await envAPI.createEnvelope(tokenRecord.accountId, {
      envelopeDefinition: envDef,
    });

    const baseDomain = process.env.APP_URL!;
    const viewRequest = {
      returnUrl: `${baseDomain}/dashboard`,
      authenticationMethod: 'none',
      email: user.member.contactInfo?.primaryEmail.address,
      userName: user.name,
      clientUserId,
      frameAncestors: [baseDomain],
      messageOrigins: [baseDomain]
    };
    let signingUrl = '';
    try {
      const recipientView = await envAPI.createRecipientView(tokenRecord.accountId, envelope.envelopeId!, { recipientViewRequest: viewRequest });
      signingUrl = recipientView.url!;
    } catch(error) {
      console.error('Error creating invoice envelope', error);
    }

    return {
      signingUrl,
      envelopeId: envelope.envelopeId!
    };
  }
}