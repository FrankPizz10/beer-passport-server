import { expo, prismaCtx } from '../index';
import { Expo } from 'expo-server-sdk';

interface ExpoPushMessage {
    to: string;
    sound: 'default';
    title: string;
    body: string;
    data: { additionalData: string };
}

export async function sendNotifications(tokens: string[], notification: { title: string; body: string }) {
    let messages: ExpoPushMessage[] = [];
    for (let pushToken of tokens) {
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
  
    let chunks = expo.chunkPushNotifications(messages);
  
    for (let chunk of chunks) {
      try {
        let receipts = await expo.sendPushNotificationsAsync(chunk);
        console.log(receipts);
      } catch (error) {
        console.error(error);
      }
    }
}