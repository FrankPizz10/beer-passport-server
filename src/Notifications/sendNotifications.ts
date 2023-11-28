import { expo } from '../index';
import { Expo } from 'expo-server-sdk';

interface ExpoPushMessage {
  to: string;
  sound: 'default';
  title: string;
  body: string;
  data: { additionalData: string };
}

export async function sendNotifications(
  tokens: string[],
  notification: { title: string; body: string },
) {
  const messages: ExpoPushMessage[] = [];
  for (const pushToken of tokens) {
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Invalid push token: ${pushToken}`);
      continue;
    }

    messages.push({
      to: pushToken,
      sound: 'default',
      title: notification.title,
      body: notification.body,
      data: { additionalData: 'optional' },
    });
  }

  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (error) {
      console.error(error);
    }
  }
}
