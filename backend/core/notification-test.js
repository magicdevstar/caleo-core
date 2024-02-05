const webPush = require("web-push");

const keys = {
  "publicKey": process.env.PUB_KEY,
  "privateKey": process.env.PRIV_KEY,
};

webPush.setVapidDetails(
  "https://app.caleo.com",
  keys.publicKey,
  keys.privateKey,
);

(async () => {
  try {
    const subscription = {
      "endpoint": "https://web.push.apple.com/QEiHP6khrjtYgpqGOw2-eUpB_myIKguAq60i9o4dOO_57GTPQ509OXpYrS2pL5vtXJdioVS9VU4GyTj7KXBB3scZuqyIqi0THiAt0XNtLQ-CdOAAu5IdCA8Haj-9hJmCq9qxfQkVsx3w9CWtTVPIQ5L7TK45YFlYe67Bew6I2nc",
      "keys": {
        "p256dh": "BLHGkhCIgygPAMzdKtab2ffkDvj3YPJbp961X-hjajf_WRIa_ecVQaEkRtv3zdKVx52d09o8Kgwi9OxxkuCZHo4",
        "auth": "FsBhv1HAAWtvSg19bWyWTQ"
      }
    };
    const payload = 'You have been unassigned blah - blah by Caleo Admin.';
    const out = await webPush.sendNotification(subscription, payload, {TTL: 10});
  } catch(error) {
    console.log(error);
  }
})();
