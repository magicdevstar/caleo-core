export enum DocusignStatus {
  COMPLETED = 'COMPLETED',
  SENT = 'SENT',
  VOIDED = 'VOIDED',
  DECLINED = 'DECLINED',
  SIGNED = 'SIGNED',
  DEFAULT = 'DEFAULT',
};

export const docusignStatusLabel = (status?: string) => {
  switch ((status || '').toUpperCase()) {
    case DocusignStatus.COMPLETED:
      return 'Completed';
    case DocusignStatus.SENT:
      return 'Sent';
    case DocusignStatus.VOIDED:
      return 'Voided';
    case DocusignStatus.DECLINED:
      return 'Declined';
    case DocusignStatus.SIGNED:
      return 'Signed';
    default:
      // If the status is not recognized, return an empty string so downstream components
      // can have a fallback or default behavior.
      return '';
  }
};

export const docusignStatusColor = (status?: string) => {
  switch ((status || '').toUpperCase()) {
    case DocusignStatus.COMPLETED:
    case DocusignStatus.SIGNED:
      return 'success';
    case DocusignStatus.SENT:
      return 'warning';
    case DocusignStatus.VOIDED:
      return 'error';
    case DocusignStatus.DECLINED:
    default:
      return 'default';
  }
};
