export const docusignStatusColor = (status?: string) => {
  switch ((status || '').toUpperCase()) {
    case 'COMPLETED':
      return 'success';
    case 'SENT':
      return 'warning';
    case 'VOIDED':
      return 'error';
    default:
      return 'default';
  }
};
