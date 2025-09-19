import { ObjectId } from "mongodb";
import { EventModel } from "../models/event";
import { IShift, ShiftModel } from "../models/shift";
import { DocusignEvent, EventStatus } from "../__generated__/resolvers-types";
import { IIncidentForm, IncidentSubmissionModel } from "../models/incidentForm";
import { IUser } from "../types/common";
import { IVehicleCategory } from "../models/vehicleCategories";
import { IRank } from "../models/rank";
import { IDivision } from "../models/division";
import { IUnit } from "../models/unit";
import { IOrganization } from "../models/organizations/organization.entity";
import { docusignDates } from "../utils/date.helpers";
import logger from "../utils/logger";

export interface IFinanceShift {
  user: IUser;
  rank: IRank;
  division: IDivision;
  unit: IUnit;
  startTime: Date;
  endTime: Date;
  totalOvertimeHours: number;
  totalStraightHours: number;
  totalVehicleMilage: number; // This is the difference between ending and starting mileage
  vehicleCategory?: IVehicleCategory | null;
  docusignEvent: DocusignEvent;
};

interface IExtendedIncidentForm extends IIncidentForm {
  user: IUser;
  rank: IRank;
  division: IDivision;
  unit: IUnit;
  vehicleCategory?: IVehicleCategory;
  docusignEvent: DocusignEvent;
}

interface IExtendedShift extends IShift {
  user: IUser;
  rank: IRank;
  division: IDivision;
  unit: IUnit;
  vehicleCategory?: IVehicleCategory;
  docusignEvent: DocusignEvent;
}

export class FinanceService {
  constructor(
    private readonly events: EventModel,
    private readonly shifts: ShiftModel,
    private readonly submissions: IncidentSubmissionModel,
  ) {}

  async get(eventId: ObjectId, org: IOrganization) {
    const event = await this.events.get(eventId);
    if (!event) {
      throw new Error(`Event with ID ${eventId} not found`);
    }

    if (event.status === EventStatus.Incident) {
      const allSubmissions = await this.submissions.collection.aggregate<IExtendedIncidentForm>([
        {
          $match: {
            eventId,
            submittedDate: {$exists: true}
          }
        },
        {
          $lookup: {
            from: 'dsEvents',
            localField: 'envelopeId',
            foreignField: 'envelopeId',
            as: 'docusignEvent',
          }
        },
        {
          $addFields: {
            docusignEvent: { $arrayElemAt: ["$docusignEvent", 0] },
          },
        },
        {
          $match: {
            'docusignEvent.status': 'completed',
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $addFields: {
            user: { $arrayElemAt: ["$user", 0] },
          },
        },
        {
          $lookup: {
            from: 'ranks',
            localField: 'user.member.rankId',
            foreignField: '_id',
            as: 'rank',
          }
        },
        {
          $addFields: {
            rank: { $arrayElemAt: ["$rank", 0] },
          },
        },
        {
          $lookup: {
            from: 'divisions',
            localField: 'user.member.divisionId',
            foreignField: '_id',
            as: 'division',
          }
        },
        {
          $addFields: {
            division: { $arrayElemAt: ["$division", 0] },
          },
        },
        {
          $lookup: {
            from: 'units',
            localField: 'user.member.unitId',
            foreignField: '_id',
            as: 'unit',
          }
        },
        {
          $addFields: {
            unit: { $arrayElemAt: ["$unit", 0] },
          },
        },
        {
          $lookup: {
            from: 'vehicleCategories',
            localField: 'vehicleInformation.vehicleCategory',
            foreignField: '_id',
            as: 'vehicleCategory',
          }
        },
        {
          $addFields: {
            vehicleCategory: { $arrayElemAt: ["$vehicleCategory", 0] },
          },
        },
      ]).toArray();
      const mappedResponse = allSubmissions.map((submission): IFinanceShift => ({
        user: submission.user,
        rank: submission.rank,
        division: submission.division,
        unit: submission.unit,
        startTime: submission.operationalPeriod.date,
        endTime: submission.operationalPeriod.date,
        totalOvertimeHours: submission.timekeeping.overtimeHours || 0,
        totalStraightHours: submission.timekeeping.straightHours || 0,
        totalVehicleMilage: ((submission.vehicleInformation?.endingMileage || 0) -
        (submission.vehicleInformation?.startingMileage || 0)),
        vehicleCategory: submission.vehicleCategory || null,
        docusignEvent: submission.docusignEvent,
      }));
      logger.info('FinanceResponse', { mappedResponse });
      return mappedResponse;
    }

    const allShifts = await this.shifts.collection.aggregate<IExtendedShift>([
      {
        $match: {
          eventId,
          docusignEnvelopeId: { $exists: true },
          userId: { $exists: true },
          removedAt: { $exists: false }
        }
      },
      {
        $lookup: {
          from: 'dsEvents',
          localField: '_id',
          foreignField: 'shiftId',
          as: 'docusignEvent',
        }
      },
      {
        $addFields: {
          docusignEvent: { $arrayElemAt: ["$docusignEvent", 0] },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $addFields: {
          user: { $arrayElemAt: ["$user", 0] },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $addFields: {
          user: { $arrayElemAt: ["$user", 0] },
        },
      },
      {
        $lookup: {
          from: 'ranks',
          localField: 'user.member.rankId',
          foreignField: '_id',
          as: 'rank',
        }
      },
      {
        $addFields: {
          rank: { $arrayElemAt: ["$rank", 0] },
        },
      },
      {
        $lookup: {
          from: 'divisions',
          localField: 'user.member.divisionId',
          foreignField: '_id',
          as: 'division',
        }
      },
      {
        $addFields: {
          division: { $arrayElemAt: ["$division", 0] },
        },
      },
      {
        $lookup: {
          from: 'units',
          localField: 'user.member.unitId',
          foreignField: '_id',
          as: 'unit',
        }
      },
      {
        $addFields: {
          unit: { $arrayElemAt: ["$unit", 0] },
        },
      },
      {
        $lookup: {
          from: 'vehicleCategories',
          localField: 'shiftCheckInOut.equipmentDetails.vehicleCategoryId',
          foreignField: '_id',
          as: 'vehicleCategory',
        }
      },
      {
        $addFields: {
          vehicleCategory: { $arrayElemAt: ["$vehicleCategory", 0] },
        },
      },
    ]).toArray();

    return allShifts.map((shift): IFinanceShift => {
      const { formattedDiff } = docusignDates({
        startTime: shift.shiftCheckInOut?.checkInTime ? shift.shiftCheckInOut.checkInTime : shift.startTime,
        endTime: shift.shiftCheckInOut?.checkOutTime ? shift.shiftCheckInOut.checkOutTime : shift.endTime,
        startEquipmentTime: shift.shiftCheckInOut?.equipmentDetails?.checkInTime,
        endEquipmentTime: shift.shiftCheckInOut?.equipmentDetails?.checkOutTime,
        timezone: org.timezone as any,
      });
      return {
        user: shift.user,
        rank: shift.rank,
        division: shift.division,
        unit: shift.unit,
        startTime: shift.startTime,
        endTime: shift.endTime,
        totalOvertimeHours: formattedDiff,
        totalStraightHours: 0, // Maybe we can calculate from from the RDO time :)
        totalVehicleMilage: parseFloat(
          shift.docusignEvent?.signerDetails?.[0]?.data?.totalMilage ||
          '0'
        ),
        vehicleCategory: shift.vehicleCategory,
        docusignEvent: shift.docusignEvent,
      }
    });
  }
}