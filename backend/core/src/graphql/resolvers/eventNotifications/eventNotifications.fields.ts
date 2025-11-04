import { IEventNotification } from "../../../models/eventNotifications/eventNotifications.entity";
import { commonResolvers } from "../../../utils/common.resolvers";
import { Context } from "../../../utils/createContext";

export const fields = {
  EventNotification: {
    ...commonResolvers,
    org: (unit: IEventNotification, _: any, { organizations }: Context) => organizations.loader.load(unit.orgId.toString()),
    attachments: async (item: IEventNotification, _arg: unknown, { events }: Context) => {
      if (!item.attachmentPaths) {
        return [];
      }
      const results = await Promise.allSettled((item.attachmentPaths || []).map((path) => {
        return events.getDownloadUrl(path as string);
      }));

      return results.filter((result) => result.status === 'fulfilled').map((result: any) => result.value);
    },
  },
};
