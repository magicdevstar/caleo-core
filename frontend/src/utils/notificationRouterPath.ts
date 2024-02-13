import { InAppNotificationMeta } from "src/__generated__/resolvers-types";
import { MailerEvents } from "src/types/mailer";

export const notificationRouterPath = (template: string, meta?: InAppNotificationMeta) => {
  switch(template) {
    case MailerEvents.OfficerAdminApprovedSkill:
      return {
        path: '/dashboard/user',
        buttonText: 'View Profile',
      };
    case MailerEvents.AdminPendingShiftRequested:
      return {
        path: '/dashboard/admin/users/request/buffer',
        buttonText: 'View Buffer Requests',
      };
    case MailerEvents.AdminEventFullyStaffed:
      if (meta?.eventId) {
        return {
          path: `/dashboard/admin/overtime/events/${meta?.eventId}`,
          buttonText: 'View Event',
        };
      }
      return null;
    case MailerEvents.AdminEventShiftsFilled:
      if (meta?.eventId && meta?.assignmentId) {
        return {
          path: `/dashboard/admin/overtime/events/${meta?.eventId}/assignment/${meta?.assignmentId}`,
          buttonText: 'View Assignment',
        };
      }
      return null;
    case MailerEvents.OfficerPendingShiftApproved:
    case MailerEvents.OfficerNewShiftAssigned:
    case MailerEvents.OfficerAdminAssignedShift:
      return {
        path: '/dashboard',
        buttonText: 'View Overtime',
      };
    case MailerEvents.OfficerRemovedFromShift:
    case MailerEvents.AdminUnassignOfficerShift:
    case MailerEvents.AdminShiftRelinquished:
      if (meta?.eventId && meta?.assignmentId && meta?.shiftId) {
        return {
          path: `/dashboard/admin/overtime/events/${meta?.eventId}/assignment/${meta?.assignmentId}/shifts/${meta?.shiftId}`,
          buttonText: 'View Shift',
        };
      }
      return null;
    case MailerEvents.LotteryWindowClosing:
      return {
        path: '/dashboard/rank/overtime',
        buttonText: 'Rank Overtime',
      };
    case MailerEvents.OfficerAvailableOtPosted:
    case MailerEvents.OfficerFcfsShiftAvailable:
    case MailerEvents.OfficerFcfsEventAvailable:
      return {
        path: '/dashboard/available/overtime',
        buttonText: 'View Available Overtime',
      };
    case MailerEvents.AdminUserAccountRequested:
      return {
        path: '/dashboard/admin/users/request/account',
        buttonText: 'View Account Requests',
      };
    default:
      return null;
  }
};
