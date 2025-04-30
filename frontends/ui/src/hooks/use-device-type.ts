import { useEffect, useState } from 'react';

type DeviceType = 'phone' | 'tablet' | 'desktop';
interface UseDeviceTypeResult {
  deviceType: DeviceType;
  isTouchDevice: boolean;
}

export function useDeviceType(): UseDeviceTypeResult {
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');

  useEffect(() => {
    const ua = navigator.userAgent;

    const isTablet = /iPad|Tablet/i.test(ua);
    const isPhone = /iPhone|Android.*Mobile|Windows Phone/i.test(ua);
    const isAndroidTablet = /Android/i.test(ua) && !/Mobile/i.test(ua);

    if (isPhone) {
      setDeviceType('phone');
    } else if (isTablet || isAndroidTablet) {
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
