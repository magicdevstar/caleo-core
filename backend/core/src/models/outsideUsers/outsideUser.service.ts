import { ObjectId } from "mongodb";
import DataLoader from "dataloader";
import { IOutsideUser, OutsideUserRepo } from "./outsideUser.repository";
import { CreateOutsideUser } from "../../__generated__/resolvers-types";
import { IUser } from "../../types/common";

export interface ICreateOutsideUser extends CreateOutsideUser {
  orgId: ObjectId;
  modifiedById: ObjectId;
}

export class OutsideUserService {
  public loader: DataLoader<string, IOutsideUser | undefined, string>;
  constructor(
    private outsideUserRepo: OutsideUserRepo,
  ) {
    this.loader = outsideUserRepo.loader;
  }

  get(id: string) {
    return this.outsideUserRepo.get(id);
  }

  search(searchInput?: any) {
    return this.outsideUserRepo.search(searchInput);
  }

  bulkLoad(users: CreateOutsideUser[], modifiedBy: IUser) {
    const createUsers: ICreateOutsideUser[] = users.map((user) => ({
      ...user,
      orgId: modifiedBy.member.orgId,
      modifiedById: modifiedBy._id!,
    }));
    return this.outsideUserRepo.bulkWrite<ICreateOutsideUser>(createUsers);
  }

  remove(id: string, modifiedBy: IUser) {
    return this.outsideUserRepo.remove(id, { modifiedById: modifiedBy._id! });
  }
}