import { DocusignModel } from "../models/docusign";
import { EventModel } from "../models/event";
import { IOrganization, OrganizationModel } from "../models/organization";
import { RankModel } from "../models/rank";
import { IShift, ShiftModel } from "../models/shift";
import { UnitModel } from "../models/unit";
import { UserModel } from "../models/user";
import { VenueModel } from "../models/venue";
import { IUser } from "../types/common";
import logger from "../utils/logger";

export class Docusign {
  constructor(
    private organizations: OrganizationModel,
    private users: UserModel,
    private venues: VenueModel,
    private events: EventModel,
    private ranks: RankModel,
    private units: UnitModel,
    private shifts: ShiftModel,
    private docusign: DocusignModel,
  ) {}

  async updateAllDSOrgKeys() {
    return this.docusign.updateAllDSOrgKeys();
  }

  async submitEndOfShiftEnvelope ({
    shift,
    user,
    organization,
  }: {
    shift: IShift;
    user: IUser;
    organization: IOrganization;
  }) {
    if (organization.docusign && organization.docusign.templateId) {
      try {
        const event = await this.events.get(shift.eventId);
        const unit = await this.units.get(user.member.unitId!);
        const rank = await this.ranks.get(user.member.rankId!);
        const venue = await this.venues.get(event?.venueId!);
        const supervisor = await this.users.get(event?.supervisorId!);
        const lieutenant = await this.users.get(event?.lieutenantId!);

        const envelopeId = await this.docusign.createLASDShiftEnvelope({
          org: organization,
          shift,
          user,
          venue: venue!,
          userRank: rank!,
          unit: unit!,
          event: event!,
          lieutenant: lieutenant!,
          supervisor: supervisor!,
        });

        await this.shifts.setDocusignEnvelopeId({
          _id: shift._id!,
          envelopeId,
        });
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
};
