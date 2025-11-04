import { Shift } from "src/__generated__/resolvers-types";

export interface IItemData {
  items: Shift[];
  total: number;
};

export interface IMarkerDetails {
  name: string;
  latitude: number;
  longitude: number;
  status?: string;
  callSign?: string;
  shiftId?: string;
  color?: string;
};

export interface IShiftData {
  shifts: IItemData;
  awaitingArrival: IItemData;
  checkedIn: IItemData;
  checkedOut: IItemData;
  noShow: IItemData;
  late: IItemData;
  demobilized: IItemData;
  assignedShifts: IItemData;
  unassignedShifts: IItemData;
  markerLocationsCenter?: {
    latitude: number;
    longitude: number;
  } | false,
  markerLocations?: IMarkerDetails[];
};
