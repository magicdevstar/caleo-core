import { Shift } from "src/__generated__/resolvers-types";

export interface IItemData {
  items: Shift[];
  total: number;
};

export interface IShiftData {
  shifts: IItemData;
  awaitingArrival: IItemData;
  checkedIn: IItemData;
  checkedOut: IItemData;
  noShow: IItemData;
  late: IItemData;
  assignedShifts: IItemData;
  unassignedShifts: IItemData;
};
