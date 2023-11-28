export enum MailerEvents {
  AdminEventFullyStaffed = 'AdminEventFullyStaffed',
  AdminEventShiftsFilled = 'AdminEventShiftsFilled',
  AdminPendingShiftRequested = 'AdminPendingShiftRequested',
  AdminShiftNotSecured = 'AdminShiftNotSecured',
  AdminShiftNotStarted = 'AdminShiftNotStarted',
  AdminShiftRelinquished = 'AdminShiftRelinquished',
  AdminUnassignOfficerShift = 'AdminUnassignOfficerShift',
  AdminUserAccountApproved = 'AdminUserAccountApproved',
  AdminUserAccountReactivated = 'AdminUserAccountReactivated',
  AdminUserAccountRequested = 'AdminUserAccountRequested',
  AdminUserAccountRestored = 'AdminUserAccountRestored',
  LotteryWindowClosing = 'LotteryWindowClosing',
  OfficerAdminApprovedSkill = 'OfficerAdminApprovedSkil',
  OfficerAdminAssignedShift = 'OfficerAdminAssignedShift',
  OfficerAdminDeniedSkill = 'OfficerAdminDeniedSkill',
  OfficerAdminReducedMax = 'OfficerAdminReducedMax',
  OfficerAdminUpdatedAccount = 'OfficerAdminUpdatedAccount',
  OfficerAssignmentRemoved = 'OfficerAssignmentRemoved',
  OfficerAvailableOtPosted = 'OfficerAvailableOtPosted',
  OfficerEventEdited = 'OfficerEventEdited',
  OfficerEventRemoved = 'OfficerEventRemoved',
  OfficerFcfsShiftAvailable = 'OfficerFcfsShiftAvailable',
  OfficerNewShiftAssigned = 'OfficerNewShiftAssigned',
  OfficerNewShiftAssignedLottery = 'OfficerNewShiftAssignedLottery',
  OfficerPasswordResetSuccess = 'OfficerPasswordResetSuccess',
  OfficerPasswordResetTriggered = 'OfficerPasswordResetTriggered',
  OfficerPendingShiftApproved = 'OfficerPendingShiftApproved',
  OfficerPendingShiftDenied = 'OfficerPendingShiftDenied',
  AdminUserAccountDeactivated = 'AdminUserAccountDeactivated',
  AdminUserAccountDenial = 'AdminUserAccountDenial',
  AdminUserAccountRemoved = 'AdminUserAccountRemoved',
  OfficerRemovedFromShift = 'OfficerRemovedFromShift',
  OfficerShiftStartingNotification = 'OfficerShiftStartingNotification',
  OfficerUserAccountInvitation = 'OfficerUserAccountInvitation',
};

export enum SMSEvents {
  AdminEventFullyStaffed = 'AdminEventFullyStaffed',
  AdminEventShiftsFilled = 'AdminEventShiftsFilled',
  AdminUserAccountRequested = 'AdminUserAccountRequested',
  LotteryWindowClosing = 'LotteryWindowClosing',
  OfficerAdminApprovedSkill = 'OfficerAdminApprovedSkill',
  OfficerAdminAssignedShift = 'OfficerAdminAssignedShift',
  OfficerAdminDeniedSkill = 'OfficerAdminDeniedSkill',
  OfficerAdminUpdatedAccount = 'OfficerAdminUpdatedAccount',
  OfficerAssignmentRemoved = 'OfficerAssignmentRemoved',
  OfficerAvailableOtPosted = 'OfficerAvailableOtPosted',
  OfficerEventEdited = 'OfficerEventEdited',
  OfficerEventRemoved = 'OfficerEventRemoved',
  OfficerFcfsShiftAvailable = 'OfficerFcfsShiftAvailable',
  OfficerNewShiftAssigned = 'OfficerNewShiftAssigned',
  OfficerNewShiftAssignedLottery = 'OfficerNewShiftAssignedLottery',
  OfficerPasswordResetSuccess = 'OfficerPasswordResetSuccess',
  OfficerPasswordResetTriggered = 'OfficerPasswordResetTriggered',
  OfficerPendingShiftApproved = 'OfficerPendingShiftApproved',
  OfficerPendingShiftDenied =  'OfficerPendingShiftDenied',
};

export enum Action {
  SMS = 'SMS',
  Email = 'Email',
}

export interface MailerEvent {
  action: Action;
  template: MailerEvents | SMSEvents;
  data: any;
};
