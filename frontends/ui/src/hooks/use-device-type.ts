import { useEffect, useState } from 'react';

type DeviceType = 'phone' | 'tablet' | 'desktop';
interface UseDeviceTypeResult {
  deviceType: DeviceType;
  isTouchDevice: boolean;
}

export function useDeviceType(): UseDeviceTypeResult {
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');

  useEffect(() => {
    const ua = navigator.userAgent || '';
    const maxTouchPoints = navigator.maxTouchPoints || 0;
    const platform = navigator.platform || '';

    const isIpadOS = platform === 'MacIntel' && maxTouchPoints > 1;
    const isTablet = /iPad|Tablet/i.test(ua) || (isIpadOS && !/iPhone/i.test(ua));
    const isPhone = /iPhone|Android.*Mobile|Windows Phone/i.test(ua);

    if (isPhone) {
      setDeviceType('phone');
    } else if (isTablet) {
      setDeviceType('tablet');
    } else {
      setDeviceType('desktop');
    }
  }, []);

  return {
    deviceType,
    isTouchDevice: deviceType !== 'desktop',
  };
}
