import { useCallback, useEffect, useState } from "react";
import { User } from "src/__generated__/resolvers-types";
import { CREATE_BROWSER_NOTIFICATION_SUBSCRIPTION } from "src/api/user";
import { useAuthContext } from "src/auth/hooks";
import { client } from "src/utils/apollo";

const notify = 'Notification' in window ? Notification : null;

// This function is needed because Chrome doesn't accept a base64 encoded string
// as value for applicationServerKey in pushManager.subscribe yet
// https://bugs.chromium.org/p/chromium/issues/detail?id=802280
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    // eslint-disable-next-line no-useless-escape
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
 
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
 
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const validateSubscription = (user: User, cb: any = () => {}) => {
  navigator.serviceWorker.ready.then((registration) => {
    registration.pushManager.getSubscription()
      .then((subscription) => {
        if (subscription) {
          return subscription;
        }
        const vapidPublicKey = process.env.REACT_APP_VAPID_PUBLIC_KEY!;
        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

        // Otherwise, subscribe the user (userVisibleOnly allows to specify that we don't plan to
        // send notifications that don't have a visible effect for the user).
        return registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });
      })
      .then((subscription) => {
        const urls = (user.browserNotificationSettings || []).map((setting) => setting?.subscription?.endpoint);
        if (!urls.includes(subscription.endpoint)) {
          client.mutate({
            mutation: CREATE_BROWSER_NOTIFICATION_SUBSCRIPTION,
            variables: {
              input: JSON.parse(JSON.stringify(subscription)),
            }
          });
        }
        cb(true);
      })
      .catch((error) => {
        console.error('Error during service worker registration:', error);
        cb(false);
      });
  });
}

export const requestBrowserNotificationPermission = (user: User, cb: any) => {
  // Request in-app notification permissions
  // iOS requires the app to be added to the home screen before
  // you can receive in-app notifications in safari :)
  if (notify) {
    notify.requestPermission()
      .then((permission) => {
        if (permission === 'granted') {
          validateSubscription(user, cb);
        }
      });
  }
}

export const clearNotifications = () => {
  navigator.serviceWorker.ready.then((registration) => {
    registration.getNotifications?.().then((notifications) => {
      notifications.forEach((notification) => {
        notification.close();
      });
    });
  });
};

export const useBrowserNotification = () => {
  const { user } = useAuthContext();
  const [requesting, setRequesting] = useState(false);
  const [canRequest, setCanRequest] = useState(notify?.permission === 'default');

  useEffect(() => {
    if (user && notify?.permission === 'granted') {
      // Ensure we have a proper subscription configured
      validateSubscription(user);
    }
  }, [user]);

  return {
    canRequest,
    requesting,
    clearNotifications,
    requestPermission: () => {
      setRequesting(true);
      requestBrowserNotificationPermission(user!, (success: boolean) => {
        setCanRequest(!success);
        setRequesting(false);
      });
    },
  }
};
