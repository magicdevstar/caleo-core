import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { Db } from "mongodb";
import { NotificationType, ShiftNotificationAction, ShiftUpsertNotification } from "../../../backend/core/src/types/notifications";

const lambda = new LambdaClient({ region: 'us-west-2' });

export const schedulerFix = async (prodDb: Db) => {
  const or: any[] = [];

  for await (const req of prodDb.collection('shiftLotteryRequests').find({
    lotteryCounter: 0,
    status: 'APPROVED',
  })) {
    const { userId, shiftGroupId } = req;
    or.push({
      userId,
      shiftId: shiftGroupId,
    });
  }

  const shifts = await prodDb.collection('shifts').find({
    $or: or,
  }).toArray();

  for (const shift of shifts) {
    if (!shift.notificationId) {
      console.log('No notification scheduled', shift._id.toString());
      // console.log('No notification scheduled', shift._id.toString());
      // try {
      //   const out = await lambda.send(new InvokeCommand({
      //     FunctionName: 'caleo-core-prod-shiftNotificationScheduler',
      //     InvocationType: 'Event',
      //     Payload: JSON.stringify({
      //       type: NotificationType.Shift,
      //       action: ShiftNotificationAction.UpsertNotification,
      //       id: shift._id.toString(),
      //     } as ShiftUpsertNotification),
      //   }));
      //   // console.log(out);
      //   // await (async () => new Promise((resolve) => setTimeout(resolve, 500)))();
      // } catch(error) {
      //   console.log(error);
      // }
    } else {
      console.log(shift.notificationId);
    }
  }
};
