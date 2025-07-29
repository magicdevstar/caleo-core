import { ObjectId } from "mongodb";
import { toZonedTime } from 'date-fns-tz';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { DocumentModel } from "../models/document";
import { DocusignModel } from "../models/docusign";
import { DocusignEventModel, IDocusignEvent } from "../models/docusignEvent";
import { EventModel, IEvent } from "../models/event";
import { IOrganization } from "../models/organizations/organization.entity";
import { RankModel } from "../models/rank";
import { IShift, ShiftModel } from "../models/shift";
import { UnitModel } from "../models/unit";
import { UserModel } from "../models/user";
import { VenueModel } from "../models/venue";
import { IUser } from "../types/common";
import logger from "../utils/logger";
import { IIncidentForm as IncidentForm } from '../models/incidentForm';
import { DocusignEventSearchInput, DocusignEventUserRole, IncidentFormResponse } from "../__generated__/resolvers-types";
import { Signer } from "docusign-esign";
import { AssignmentModel } from "../models/assignment";
import { EquipmentModel } from "../models/equipment";
import { InvoiceService } from "./invoice.service";
import { IncidentSubmissionModel, InputIncidentForm } from "../models/incidentForm";
import { OutsideUserService } from "../models/outsideUsers/outsideUser.service";
import { requestToPDFForm } from "../models/incidentForm/lasd";
import { FormEntityType, IGenerateFormResponse, IIncidentInput, IncidentFormType } from "../types/incidentForm";
import { buildDescription } from "../utils/formDetails";

const lambda = new LambdaClient({});

export class Docusign {
  constructor(
    private users: UserModel,
    private venues: VenueModel,
    private events: EventModel,
    private ranks: RankModel,
    private units: UnitModel,
    private shifts: ShiftModel,
    private docusign: DocusignModel,
    private docusignEvent: DocusignEventModel,
    private document: DocumentModel,
    private assignments: AssignmentModel,
    private equipments: EquipmentModel,
    private invoiceService: InvoiceService,
    private outsideUsers: OutsideUserService,
    private incidentSubmission: IncidentSubmissionModel
  ) {}

  async findEventsByUserId({
    role,
    userId: uId,
    eventIds,
    ...args
  }: DocusignEventSearchInput) {
    const userId = new ObjectId(uId!);
    let userInput: {
      userId?: ObjectId;
      lieutenantId?: ObjectId;
      supervisorId?: ObjectId;
    } = {
      userId,
    };

    if (role === DocusignEventUserRole.Lieutenant) {
      userInput = {
        lieutenantId: userId,
      };
    }
    if (role === DocusignEventUserRole.Supervisor) {
      userInput = {
        supervisorId: userId,
      };
    }

    return this.docusignEvent.search({
      ...args,
      limit: args.limit || 10,
      ...userInput,
      ...(eventIds && { eventId: { $in: eventIds.map((id) => new ObjectId(id)) } }),
      order: 'desc',
      orderBy: '_id',
    });
  }

  async loadByEnvelopeId(envelopeId: string) {
    return this.docusignEvent.loadByEnvelopeId.load(envelopeId);
  }

  async loadEventsByShiftId(id: string) {
    return this.docusignEvent.loadByShiftId.load(id);
  }

  async loadEventsByEventId(id: string) {
    return this.docusignEvent.loadByEventId.load(id);
  }

  async loadByUserAndEventId(userId: ObjectId, eventId: ObjectId) {
    return this.docusignEvent.loadByUserAndEventId.load({ userId, eventId });
  }

  async saveEvent({
    incident,
    shiftId,
    status,
    envelopeId,
    signers,
  }: {
    incident?: IncidentForm;
    shiftId?: string;
    eventId?: string;
    status: string;
    envelopeId: string;
    signers: Signer[]
  }) {
    let orgId: ObjectId;
    let eventId: ObjectId;
    let userId: ObjectId;
    let otherDetails: any = {};

    if (incident) {
      eventId = incident.eventId;
      orgId = incident.orgId;
      userId = incident.userId;
    } else if (shiftId) {
      const shift = await this.shifts.get(shiftId, { removed: true });
      if (!shift) {
        throw new Error('Shift not found');
      }
      const event = await this.events.get(shift.eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      orgId = shift.orgId;
      eventId = shift.eventId;
      userId = shift.userId!;
      otherDetails = {
        assignmentId: shift.assignmentId,
        ...(event.lieutenantId && { lieutenantId: event.lieutenantId }),
        ...(event.supervisorId && { supervisorId: event.supervisorId }),
        shiftId: shift._id!,
      }
    } else {
      throw new Error('Either incident or shiftId must be provided');
    }


    // Save to collection
    await this.docusignEvent.upsertEvent({
      envelopeId,
      orgId,
      eventId,
      ...otherDetails,
      userId,
      status,
      signerDetails: signers.map((signer) => {
        const fields = {};
        const tabs = signer.tabs || {};

        for (const [tabType, tabArray] of Object.entries(tabs)) {
          if ([
            'dateSignedTabs',
            'signHereTabs',
            'initialHereTabs',
          ].includes(tabType)) {
            continue;
          }
    
          for (const tab of tabArray) {
            const tabName = tab.tabLabel || tab.name || `tab_${tab.tabId}`;
            const tabValue = tab.value ?? tab.originalValue ?? '';
            fields[tabName] = tabValue;
          }
        }

        return {
          email: signer.email!,
          status: signer.status || 'n/a',
          roleName: signer.roleName!,
          routingOrder: signer.routingOrder!,
          data: fields,
        };
      }),
    });

    // Save document to s3
    const document = await this.docusign.getDocument({
      envelopeId,
      orgId: orgId.toHexString(),
    });
    await this.document.save({
      data: Buffer.from(document, 'binary'),
      Key: this.docusignEvent.buildDocumentPath({
        envelopeId,
        orgId: orgId.toHexString(),
      }),
    });

    // We need to save the over time slip that is attached to the document
    if (incident) {
       const document = await this.docusign.getDocument({
        envelopeId,
        orgId: orgId.toHexString(),
        documentId: '2',
      });
      await this.document.save({
        data: Buffer.from(document, 'binary'),
        Key: this.docusignEvent.buildDocumentPath({
          envelopeId: `${envelopeId}-2`,
          orgId: orgId.toHexString(),
        }),
      });
    }
  }

  async saveInvoiceEvent({
    event,
    status,
    envelopeId,
    signers,
  }: {
    event: IEvent;
    status: string;
    envelopeId: string;
    signers: Signer[];
  }) {
    await this.events.setDocusignStatus(event._id!, status);
    await this.docusignEvent.upsertEvent({
      envelopeId,
      orgId: event.orgId,
      eventId: event._id!,
      userId: event.modifiedById!,
      status,
      signerDetails: signers.map((signer) => {
        const fields = {};
        const tabs = signer.tabs || {};

        for (const [tabType, tabArray] of Object.entries(tabs)) {
          if ([
            'dateSignedTabs',
            'signHereTabs',
            'initialHereTabs',
          ].includes(tabType)) {
            continue;
          }
    
          for (const tab of tabArray) {
            const tabName = tab.tabLabel || tab.name || `tab_${tab.tabId}`;
            const tabValue = tab.value ?? tab.originalValue ?? '';
            fields[tabName] = tabValue;
          }
        }

        return {
          email: signer.email!,
          status: signer.status || 'n/a',
          roleName: signer.roleName!,
          routingOrder: signer.routingOrder!,
          data: fields,
        };
      }),
    });

    // Save document to s3
    const document = await this.docusign.getDocument({
      envelopeId,
      orgId: event.orgId.toString(),
    });
    await this.document.save({
      data: Buffer.from(document, 'binary'),
      Key: this.docusignEvent.buildDocumentPath({
        envelopeId,
        orgId: event.orgId.toString(),
      }),
    });
  }

  async getDocumentUrl({
    event,
    docId,
  }: {
    event: IDocusignEvent;
    docId?: string;
  }) {
    const Key = this.docusignEvent.buildDocumentPath({
      envelopeId: `${event.envelopeId}${docId ? `-${docId}` : ''}`,
      orgId: event.orgId.toString(),
    });
    if (!await this.document.documentExists(Key)) {
      return null;
    }
    return this.document.getDownloadUrl(Key);
  }

  async updateAllDSOrgKeys() {
    return this.docusign.updateAllDSOrgKeys();
  }

  async getTabs({
    shiftId,
    organization,
  }: {
    shiftId: string;
    organization: IOrganization;
  }) {
    if (organization.features.endOfShiftPDF) {
      const shift = await this.shifts.get(shiftId);
      if (!shift) {
        throw new Error('Shift not found');
      }

      const user = await this.users.get(shift.userId!);
      if (!user) {
        throw new Error('User not found');
      }
      const event = await this.events.get(shift.eventId);
      if (!event) {
        throw new Error('Event not found');
      }
      const assignment = await this.assignments.get(shift.assignmentId);
      const unit = await this.units.get(user.member.unitId!);
      const rank = await this.ranks.get(user.member.rankId!);

      // Get lieutenant and supervisor from assignment or event
      const eventLieutenant = await this.assignments.getSigningAuthorityUser(event.lieutenantAssignmentId);
      const assignmentLieutenant = await this.assignments.getSigningAuthorityUser(assignment?.lieutenantAssignmentId);

      const eventSupervisor = await this.assignments.getSigningAuthorityUser(event.supervisorAssignmentId);
      const assignmentSupervisor = await this.assignments.getSigningAuthorityUser(assignment?.supervisorAssignmentId);

      const supervisor = assignmentSupervisor || eventSupervisor;
      const lieutenant = assignmentLieutenant || eventLieutenant;

      const tabs = await this.docusign.generateTabs({
        org: organization,
        shift,
        user,
        assignment: assignment!,
        userRank: rank!,
        unit: unit!,
        event: event!,
        lieutenant: lieutenant!,
        supervisor: supervisor!,
      });

      return {
        tabs,
        templateName: rank?.name.toLowerCase().includes('deputy, reserve') ? 'shift-close-reserve' : 'shift-close',
      };
    }

    return {};
  }

  async resubmitEndOfShiftEnvelope({
    shift,
    organization,
  }: {
    shift: IShift | null;
    organization: IOrganization;
  }) {
    if (organization.features.docusignCheckout && organization.docusign && organization.docusign.templateId && shift) {
      try {
        const docusignEvent = await this.docusignEvent.findByShiftId(shift._id!);
        if (docusignEvent) {
          await this.docusign.voidEnvelope({
            envelopeId: docusignEvent.envelopeId,
            currentStatus: docusignEvent.status,
            org: organization,
          });

          const user = await this.users.get(shift.userId!);
          if (!user) {
            throw new Error('User not found');
          }
          const event = await this.events.get(shift.eventId);
          if (!event) {
            throw new Error('Event not found');
          }
          const unit = await this.units.get(user.member.unitId!);
          const rank = await this.ranks.get(user.member.rankId!);
          const assignment = await this.assignments.get(shift.assignmentId);

          // Get lieutenant and supervisor from assignment or event
          const eventLieutenant = await this.assignments.getSigningAuthorityUser(event.lieutenantAssignmentId);
          const assignmentLieutenant = await this.assignments.getSigningAuthorityUser(assignment?.lieutenantAssignmentId);

          const eventSupervisor = await this.assignments.getSigningAuthorityUser(event.supervisorAssignmentId);
          const assignmentSupervisor = await this.assignments.getSigningAuthorityUser(assignment?.supervisorAssignmentId);

          const supervisor = assignmentSupervisor || eventSupervisor;
          const lieutenant = assignmentLieutenant || eventLieutenant;

          let requiresVehicleInformation = false;

          if (Array.isArray(assignment?.requiredEquipmentIds) && assignment.requiredEquipmentIds.length > 0) {
            const equipment = await this.equipments.findAll(assignment.requiredEquipmentIds);
            requiresVehicleInformation = equipment.some((eq) => eq.requiresVehicleInformation);
          }
  
          const {
            envelopeId,
            signingUrl,
          } = await this.docusign.createLASDShiftEnvelope({
            org: organization,
            assignment,
            shift,
            user,
            userRank: rank!,
            unit: unit!,
            event: event!,
            lieutenant: lieutenant!,
            supervisor: supervisor!,
            signNow: false,
            requiresVehicleInformation,
          });
          await this.shifts.setDocusignEnvelopeId({
            _id: shift._id!,
            envelopeId,
          });
          return {
            envelopeId,
            signingUrl,
          };
        }
      } catch(error) {
        logger.error('Error updating prefilled tabs', {
          error,
          shift,
          organization,
        });
      }
    }
  }

  async submitEndOfShiftEnvelope ({
    shift,
    organization,
    signNow,
  }: {
    shift: IShift;
    organization: IOrganization;
    signNow: boolean;
  }) {
    if (organization.features.docusignCheckout && organization.docusign && organization.docusign.templateId) {
      try {
        const user = await this.users.get(shift.userId!);
          if (!user) {
            throw new Error('User not found');
          }
        const event = await this.events.get(shift.eventId);
        if (!event) {
          throw new Error('Event not found');
        }
        const unit = await this.units.get(user.member.unitId!);
        const rank = await this.ranks.get(user.member.rankId!);
        const assignment = await this.assignments.get(shift.assignmentId!);

        // Get lieutenant and supervisor from assignment or event
        const eventLieutenant = await this.assignments.getSigningAuthorityUser(event.lieutenantAssignmentId);
        const assignmentLieutenant = await this.assignments.getSigningAuthorityUser(assignment?.lieutenantAssignmentId);

        const eventSupervisor = await this.assignments.getSigningAuthorityUser(event.supervisorAssignmentId);
        const assignmentSupervisor = await this.assignments.getSigningAuthorityUser(assignment?.supervisorAssignmentId);

        const supervisor = assignmentSupervisor || eventSupervisor;
        const lieutenant = assignmentLieutenant || eventLieutenant;

        let requiresVehicleInformation = false;

        if (Array.isArray(assignment?.requiredEquipmentIds) && assignment.requiredEquipmentIds.length > 0) {
          const equipment = await this.equipments.findAll(assignment.requiredEquipmentIds);
          requiresVehicleInformation = equipment.some((eq) => eq.requiresVehicleInformation);
        }

        const {
          envelopeId,
          signingUrl,
        } = await this.docusign.createLASDShiftEnvelope({
          org: organization,
          assignment,
          shift,
          user,
          userRank: rank!,
          unit: unit!,
          event: event!,
          lieutenant: lieutenant!,
          supervisor: supervisor!,
          signNow,
          requiresVehicleInformation,
        });

        await this.shifts.setDocusignEnvelopeId({
          _id: shift._id!,
          envelopeId,
        });
        return {
          envelopeId,
          signingUrl,
        };
      } catch(error) {
        logger.error('Error submitting end of shift envelope', {
          error,
          shift,
          organization,
        });
      }
    }
  }

  async createInvoiceHTML({
    eventId,
    organization,
  }: {
    eventId: ObjectId;
    organization: IOrganization;
  }) {
    const event = await this.events.get(eventId);
    if (!event) {
      throw new Error('Event not found');
    }
    const allShifts = await this.shifts.findAllByEventId({ eventId, assignedOnly: true });
    const userIds = allShifts.map((shift) => shift.userId!);
    const allUsers = await this.users.findAll(userIds);
    const allRankIds = allUsers.map((user) => user.member.rankId!);
    const allRanks = await this.ranks.findAll(allRankIds);

    const invoiceHtml = this.invoiceService.createInvoice({
      event,
      organization,
      ranks: allRanks,
      users: allUsers,
      shifts: allShifts,
    });

    return invoiceHtml;
  }

  async submitEventInvoice({
    eventId,
    user,
    organization,
  }: {
    eventId: ObjectId;
    user: IUser;
    organization: IOrganization;
  }) {
    if (organization.docusign) {
      try {
        const invoiceHtml = await this.createInvoiceHTML({
          eventId,
          organization,
        });

        const res = await this.docusign.createInvoiceEnvelope({
          org: organization,
          eventId: eventId.toString(),
          invoice: invoiceHtml,
          user,
        });

        await this.events.setDocusignEnvelopeId(eventId, res.envelopeId);

        return res.signingUrl;
      } catch(error) {
        console.error('Error creating invoice envelope', error);
        logger.error('Error submitting event invoice', {
          error,
          eventId,
          user,
          organization,
        });
      }
    }
  }

  async submitIncidentForm({
    saveOnly,
    incidentForm,
    org,
    user,
  }: {
    saveOnly: boolean;
    incidentForm: InputIncidentForm;
    org: IOrganization;
    user: IUser;
  }): Promise<IncidentFormResponse> {
    const savedForm = await this.incidentSubmission.upsert({
      ...incidentForm,
      ...(!saveOnly && { submittedDate: toZonedTime(new Date(), org.timezone || 'America/Los_Angeles') })
    });
    if (!saveOnly) {
      const existing = await this.incidentSubmission.findExistingByEventId(user._id!, incidentForm.eventId, incidentForm.operationalPeriod.date);
      if (existing && existing?._id?.toHexString() !== savedForm.id && !['voided', 'declined'].includes(existing?.docusignEvent?.status)) {
        throw new Error('An incident form already exists for this event and date');
      }
      const event = await this.events.get(incidentForm.eventId);
      if (!event) {
        throw new Error('Event not found');
      }
      const reviewer = await this.outsideUsers.get(incidentForm.reviewer)
      if (!reviewer) {
        throw new Error('Reviewer user not found');
      }
  
      const rank = await this.ranks.get(user.member.rankId!);
      if (!rank) {
        throw new Error('User rank not found');
      }
  
      const unit = await this.units.get(user.member.unitId!);
      if (!unit) {
        throw new Error('User unit not found');
      }

      const incidentFormDetails = requestToPDFForm({
        incidentForm,
        reviewer,
        event,
        user,
        supervisor: reviewer,
        org,
        rank,
        unit,
        incidentCommander: reviewer,
        details: buildDescription(event.name, incidentForm),
      });
  
      // Submit to docusign
      const input: IIncidentInput = {
        entityId: event._id!.toHexString(),
        entityType: FormEntityType.EVENTS,
        incidentFormId: savedForm.id!,
        org,
        user,
        isReserve: rank.name.toLowerCase().includes('deputy, reserve'),
        reviewer,
        totalActivities: incidentForm.activityLog.entries!.length,
        incidentFormDetails,
        type: IncidentFormType.LASD_INCIDENT_FORM,
      };
      const lambdaResponse = await lambda.send(new InvokeCommand({
        FunctionName: process.env.GENERATE_INCIDENT_FORM_LAMBDA!,
        InvocationType: 'RequestResponse',
        Payload: Buffer.from(JSON.stringify(input)),
      }));
      const res: IGenerateFormResponse = JSON.parse(new TextDecoder().decode(lambdaResponse.Payload!));
  
      // Save to mongo
      this.incidentSubmission.saveEnvelopeId(new ObjectId(savedForm.id), res.envelopeId);
  
      return {
        ...res,
        incidentForm: {
          ...savedForm,
          envelopeId: res.envelopeId,
        } as any,
      };
    }
    return {
      incidentForm: savedForm as any,
    }
  }
};
