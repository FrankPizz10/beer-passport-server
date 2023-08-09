import * as admin from 'firebase-admin';
import * as serviceAccount from '../../Secrets/beerpassport-b31d8-firebase-adminsdk-6avyz-4f32856e2e.json';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

export { admin };
