import { Auth } from '@aws-amplify/auth';
import { Preferences } from '@capacitor/preferences';

import { AMPLIFY_API } from '../config-global';

class CustomStorage {
  data: Record<string, string> = {};
  MEMORY_KEY_PREFIX = 'amp:';
  constructor() {}

  setItem(key: string, value: string): string {
    Preferences.set({
      key: `${this.MEMORY_KEY_PREFIX}${key}`,
      value,
    });
    this.data[key] = value;
    return this.data[key];
  }

  getItem(key: string) {
    return this.data[key];
  }

  removeItem(key: string) {
    Preferences.remove({ key: `${this.MEMORY_KEY_PREFIX}${key}` });
    delete this.data[key];
  }

  clear() {
    this.data = {};
  }

  async sync() {
    const { keys } = await Preferences.keys();
    for (const key of keys) {
      const res = await Preferences.get({ key });
      this.data[key] = res.value || '';
    }
  }
}

export const customStorage = new CustomStorage();

Auth.configure({
  ...AMPLIFY_API,
  storage: customStorage,
});

export default Auth;
