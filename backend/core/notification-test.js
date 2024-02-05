const webPush = require("web-push");

const keys = {
  "publicKey": "BL2SasA9uga635D86dqww_O_qrEKA3cZDBQpHdaujGjxnsFHERTuzJGCy6j3oSIob2X2n_2FbsHPXCBTIJHw7ro",
  "privateKey": "jr7Yc-BKEWrPzlqUd0Xbr8xp34BcH49HYBV_qRbJXYM"
};

webPush.setVapidDetails(
  "https://app.caleo.com",
  keys.publicKey,
  keys.privateKey,
);

(async () => {
  try {
    const subscription = {
        "endpoint": "https://fcm.googleapis.com/fcm/send/cwcDqNvlDYQ:APA91bFnhcQkcJFz6_lgs0xMvaOrndo1027BDocwHT9KBImW-d-vlWbM99Y7xmJs0-IEnA6rW0EaUADGpu2BFfbImnDmQ9xUz78GygKBw6WV6LfLiPT-SP0lU-yxa7anQZUxpUvzGY_h",
        "expirationTime": null,
        "keys": {
            "p256dh": "BKfyk65Z9YlpRQXSq7K03SU7d3PdWbZmIQthkr0z66CanaDsuNuGsSscs4X7q7Rt8uWYrL57wh9ot9rsGtg-Ueg",
            "auth": "0p2ZWNbWjfLForWGvv-29A"
        }
    };
    const payload = 'You have been unassigned blah - blah by Caleo Admin';
    const out = await webPush.sendNotification(subscription, payload, {TTL: 10});
  } catch(error) {
    console.log(error);
  }
})();
