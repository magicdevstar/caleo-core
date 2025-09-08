import { MailerEvents } from "./mailer";

export const InAppTemplates = {
  [MailerEvents.OfficerEventRemoved]: ({
    eventName,
    metroName,
    shiftName,
  }) => ({
    title: 'Event Removed',
    body: `${eventName} has been removed from ${metroName} Caleo, so you are no longer required to work your ${shiftName} shift for this event.`,
  }),
  [MailerEvents.OfficerEventEdited]: ({
    eventName,
  }) => ({
    title: 'Event Modified',
    body: `${eventName} has been modified. Please review the changes.`,
  }),
  [MailerEvents.OfficerAssignmentEdited]: ({
    eventName,
    assignmentName,
  }) => ({
    title: 'Assignment Modified',
    body: `${eventName} ${assignmentName} has been modified. Please review the changes.`,
  }),
  [MailerEvents.OfficerShiftEdited]: ({
    eventName,
    assignmentName,
  }) => ({
    title: 'Shift time updated!',
    body: `${eventName} ${assignmentName} times have been modified. Please review the changes.`,
  }),
  [MailerEvents.OfficerAdminApprovedSkill]: ({
    metroName,
    skillName,
  }) => ({
    title: 'Skill Approved',
    body: `An administrator for ${metroName} Caleo has approved your ${skillName} skill request!`,
  }),
  [MailerEvents.OfficerAdminDeniedSkill]: ({
    metroName,
    skillName,
  }) => ({
    title: 'Skill Denied',
    body: `An administrator for ${metroName} Caleo has denied your ${skillName} skill request.`,
  }),
  [MailerEvents.OfficerAdminApprovedEquipment]: ({
    metroName,
    equipmentName,
  }) => ({
    title: 'Equipment Approved',
    body: `An administrator for ${metroName} Caleo has approved your ${equipmentName} equipment request!`,
  }),
  [MailerEvents.OfficerAdminDeniedEquipment]: ({
    metroName,
    equipmentName,
  }) => ({
    title: 'Equipment Denied',
    body: `An administrator for ${metroName} Caleo has denied your ${equipmentName} equipment request.`,
  }),
  [MailerEvents.AdminPendingShiftRequested]: ({
    name,
  }) => ({
    title: 'Pending Shift Requested',
    body: `${name} has requested a buffer override. Please review the shift buffer.`,
  }),
  [MailerEvents.AdminEventFullyStaffed]: ({
    eventRefNumber,
    eventName,
    venueName,
  }) => ({
    title: 'Event Fully Staffed',
    body: `#${eventRefNumber} - ${eventName} at ${venueName} has been fully staffed.`,
  }),
  [MailerEvents.AdminEventShiftsFilled]: ({
    eventName,
    shiftName,
    venueName,
  }) => ({
    title: 'Event Shifts Filled',
    body: `${shiftName} for ${eventName} at ${venueName} is now fully staffed!`,
  }),
  [MailerEvents.OfficerPendingShiftApproved]: ({
    shiftName,
    eventName,
    venueName,
  }) => ({
    title: 'Pending Shift Approved',
    body: `Your buffer override request for ${shiftName} for ${eventName} at ${venueName} has been approved!`,
  }),
  [MailerEvents.OfficerPendingShiftDenied]: ({
    shiftName,
    eventName,
    venueName,
    reason,
  }) => ({
    title: 'Pending Shift Denied',
    body: `Your buffer override request for ${shiftName} for ${eventName} at ${venueName} has been denied for the following reason: ${reason}`,
  }),
  [MailerEvents.OfficerAdminAssignedShift]: ({
    metroName,
    shiftName,
    eventName,
    venueName,
  }) => ({
    title: 'Shift Assigned',
    body: `An administrator for ${metroName} Caleo has assigned you ${shiftName} for ${eventName} at ${venueName}.`,
  }),
  [MailerEvents.OfficerRemovedFromShift]: ({
    eventName,
    shiftName,
  }) => ({
    title: 'Removed from Shift',
    body: `You have been removed from ${eventName} - ${shiftName}`,
  }),
  [MailerEvents.AdminUnassignOfficerShift]: ({
    eventName,
    eventRefNumber,
    shiftName,
    officerName,
    adminName,
  }) => ({
    title: 'Shift Unassigned',
    body: `${officerName} has been unassigned from #${eventRefNumber} ${eventName} - ${shiftName} by ${adminName}`,
  }),
  [MailerEvents.AdminShiftRelinquished]: ({
    officerName,
    eventName,
    eventRefNumber,
    shiftName,
    reason,
  }) => ({
    title: 'Shift Relinquished',
    body: `${officerName} has relinquished their shift for #${eventRefNumber} ${eventName} - ${shiftName} for the following reason: ${reason}`,
  }),
  [MailerEvents.OfficerAssignmentRemoved]: ({
    eventName,
    metroName,
    shiftName,
  }) => ({
    title: 'Assignment Removed',
    body: `The ${shiftName} assignment for ${eventName} has been removed from ${metroName} Caleo, so you are no longer required to work your shift for this assignment.`,
  }),
  [MailerEvents.OfficerShiftStartingNotification]: ({
    eventName,
    shiftName,
    durationTilShift,
  }) => ({
    title: `Shift Starting in ${durationTilShift}`,
    body: `Your ${shiftName} shift for ${eventName} is starting in ${durationTilShift}`,
  }),
  [MailerEvents.LotteryWindowClosing]: ({
    metroName,
    num,
  }) => ({
    title: 'Lottery Window Closing',
    body: `The ${metroName} Caleo lottery ranking window closes in ${num} hours - don't forget to rank your preferences!`,
  }),
  [MailerEvents.OfficerAvailableOtPosted]: ({
    metroName,
  }) => ({
    title: 'Available OT Posted',
    body: `New overtime opportunities are available for ${metroName} Caleo!`,
  }),
  [MailerEvents.OfficerFcfsShiftAvailable]: ({
    eventName,
    metroName,
    shiftName,
  }) => ({
    title: 'FCFS Shift Available',
    body: `Shifts for the ${shiftName} assignment at ${eventName} are still available in ${metroName} Caleo!`,
  }),
  [MailerEvents.OfficerFcfsEventAvailable]: ({
    eventName,
    metroName,
  }) => ({
    title: 'FCFS Event Available',
    body: `Shifts for the ${eventName} event are still available in ${metroName} Caleo`,
  }),
  [MailerEvents.AdminUserAccountRequested]: ({
    name,
    metroName,
  }) => ({
    title: 'User Account Requested',
    body: `${name} has requested to join ${metroName} on Caleo`,
  }),
  [MailerEvents.OfficerUserAccountDeactivated]: ({
    metroName,
  }) => ({
    title: 'User Account Deactivated',
    body: `Your ${metroName} Caleo account has been deactivated. If you have questions, reach out to your system administrator.`,
  }),
  [MailerEvents.OfficerUserAccountReactivated]: () => ({
    title: 'User Account Reactivated',
    body: `Your Caleo account has been reactivated. Welcome back!`,
  }),
  [MailerEvents.OfficerNewShiftAssigned]: ({
    shiftName,
    eventName,
    venueName,
  }) => ({
    title: 'Shift Secured',
    body: `You have been assigned to ${shiftName} for ${eventName} at ${venueName}.`,
  }),
  [MailerEvents.OfficerShiftAutoCheckout]: ({
    shiftName,
    endTime,
  }) => ({
    title: 'You have been checked out of your shift',
    body: `You have been automatically checked out of shift ${shiftName} because this event ended at ${endTime}.`,
  }),
  [MailerEvents.OfficerShiftCheckInOutEdited]: ({
    eventName,
    shiftName,
    oldOutTime,
    newOutTime,
    oldInTime,
    newInTime,
    notes,
  }) => ({
    title: `${eventName} - ${shiftName} check in/out time has been updated!`,
    body: `${oldInTime ? `Check in changed from ${oldInTime.date} ${oldInTime.time} to ${newInTime.date} ${newInTime.time}. ` : ''}${oldOutTime ? `Check out changed from ${oldOutTime.date} ${oldOutTime.time} to ${newOutTime.date} ${newOutTime.time}.` : ''} ${notes ? `Note: ${notes}` : ''}`,
  }),
  [MailerEvents.OfficerInterestListOpening]: ({
    eventName,
  }) => ({
    title: `New Event: ${eventName}. Express interest now!`,
    body: `New Event! You can now express your interest in working ${eventName}.`,
  }),
  [MailerEvents.OfficerInterestListClosing]: ({
    eventName,
  }) => ({
    title: `Last chance to show your interest in working ${eventName}!`,
    body: `You can now express your interest in working ${eventName}.`,
  }),
  [MailerEvents.AdminEventRequested]: ({
    eventName,
    eventRefNumber,
  }) => ({
    title: 'An event request has been submitted!',
    body: `Please review the new event request for ${eventName} #${eventRefNumber}.`,
  }),
};
