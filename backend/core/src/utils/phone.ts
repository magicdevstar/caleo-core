import parsePhoneNumber from 'libphonenumber-js';

export const phoneNumberParser = (phoneNumber?: string) => {
  const parsed = parsePhoneNumber(phoneNumber || '', 'US');
  if (parsed && parsed.isValid()) {
    return parsed.number;
  }
};
