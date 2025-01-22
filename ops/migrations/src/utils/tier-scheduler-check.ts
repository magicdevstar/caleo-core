import {
  SchedulerClient,
  CreateScheduleCommand,
  UpdateScheduleCommand,
  GetScheduleCommand,
  CreateScheduleCommandInput,
  FlexibleTimeWindowMode,
  Target,
  ScheduleState,
  UpdateScheduleCommandInput,
  DeleteScheduleCommand,
  ActionAfterCompletion
} from "@aws-sdk/client-scheduler";
import { Db, ObjectId } from "mongodb";

const scheduler = new SchedulerClient({ region: 'us-west-2' });

export const tierChecker = async (prodDb: Db) => {
  const users = await prodDb.collection('users');

  for await (const user of users.find({
    'member.tier': 'TIER_2',
    'member.tierUntil': {$gte: 1704087199207},
  })) {
    const key = `user_tier_return-${user._id.toString()}`;
    const command = new GetScheduleCommand({
      Name: key,
    });

    try {
      const res = await scheduler.send(command);
      console.log('Found');
      continue;
    } catch(error) {
      console.log('Not found for', user._id.toString());
      continue;
    }
  }
  
  // console.log('res: ', JSON.stringify(res, null, 2));
};
