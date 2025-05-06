import { ObjectId } from "mongodb";
import { DocumentModel } from "../models/document";
import { DocusignModel } from "../models/docusign";
import { DocusignEventModel, IDocusignEvent } from "../models/docusignEvent";
import { EventModel } from "../models/event";
import { IOrganization } from "../models/organizations/organization.entity";
import { RankModel } from "../models/rank";
import { IShift, ShiftModel } from "../models/shift";
import { UnitModel } from "../models/unit";
import { UserModel } from "../models/user";
import { VenueModel } from "../models/venue";
import { IUser } from "../types/common";
import logger from "../utils/logger";
import { DocusignEventSearchInput, DocusignEventUserRole } from "../__generated__/resolvers-types";
import { Signer } from "docusign-esign";
import { AssignmentModel } from "../models/assignment";
import { EquipmentModel } from "../models/equipment";

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

  async loadEventsByShiftId(id: string) {
    return this.docusignEvent.loadByShiftId.load(id);
  }

  async saveEvent({
    shiftId,
    status,
    envelopeId,
    signers,
  }: {
    shiftId: string;
    status: string;
    envelopeId: string;
    signers: Signer[]
  }) {
    const shift = await this.shifts.get(shiftId, { removed: true });
    if (!shift) {
      throw new Error('Shift not found');
    }
    const event = await this.events.get(shift.eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // Save to collection
    await this.docusignEvent.upsertEvent({
      envelopeId,
      orgId: shift.orgId,
      eventId: shift.eventId,
      assignmentId: shift.assignmentId,
      ...(event.lieutenantId && { lieutenantId: event.lieutenantId }),
      ...(event.supervisorId && { supervisorId: event.supervisorId }),
      shiftId: shift._id!,
      userId: shift.userId!,
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
      orgId: shift.orgId.toString(),
    });
    await this.document.save({
      data: Buffer.from(document, 'binary'),
      Key: this.docusignEvent.buildDocumentPath({
        envelopeId,
        orgId: shift.orgId.toString(),
      }),
    });
  }

  async getDocumentUrl({
    event,
  }: {
    event: IDocusignEvent;
  }) {
    const Key = this.docusignEvent.buildDocumentPath({
      envelopeId: event.envelopeId,
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

  async resubmitEndOfShiftEnvelope({
    shift,
    user,
    organization,
  }: {
    shift: IShift | null;
    user: IUser;
    organization: IOrganization;
  }) {
    if (organization.docusign && organization.docusign.templateId && shift) {
      try {
        const docusignEvent = await this.docusignEvent.findByShiftId(shift._id!);
        if (docusignEvent) {
          await this.docusign.voidEnvelope({
            envelopeId: docusignEvent.envelopeId,
            org: organization,
          });

          const event = await this.events.get(shift.eventId);
          const unit = await this.units.get(user.member.unitId!);
          const rank = await this.ranks.get(user.member.rankId!);
          const venue = await this.venues.get(event?.venueId!);
          const supervisor = await this.users.get(event?.supervisorId!);
          const lieutenant = await this.users.get(event?.lieutenantId!);
          const assignment = await this.assignments.get(shift.assignmentId!);
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
            shift,
            user,
            venue: venue!,
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
          user,
          organization,
        });
      }
    }
  }

  async submitEndOfShiftEnvelope ({
    shift,
    user,
    organization,
    signNow,
  }: {
    shift: IShift;
    user: IUser;
    organization: IOrganization;
    signNow: boolean;
  }) {
    if (organization.docusign && organization.docusign.templateId) {
      try {
        const event = await this.events.get(shift.eventId);
        const unit = await this.units.get(user.member.unitId!);
        const rank = await this.ranks.get(user.member.rankId!);
        const venue = await this.venues.get(event?.venueId!);
        const supervisor = await this.users.get(event?.supervisorId!);
        const lieutenant = await this.users.get(event?.lieutenantId!);
        const assignment = await this.assignments.get(shift.assignmentId!);
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
          shift,
          user,
          venue: venue!,
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
          user,
          organization,
        });
      }
    }
  }

  async updateEndOfShiftPrefilledTabs ({
    shift,
  }: {
    shift: IShift,
  }) {

  }
};
