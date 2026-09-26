import { MongoClient, type Db } from 'mongodb';

const uri = (process.env.MONGODB_URI || 'mongodb://localhost:27017').trim();
const dbName = (process.env.MONGODB_DB || 'clothes').trim() || 'clothes';

let client: MongoClient | null = null;
let db: Db | null = null;
let connecting: Promise<Db | null> | null = null;

export function mongoConfig() {
  return { uri, dbName };
}

export async function getDb(): Promise<Db | null> {
  if (db) return db;
  if (connecting) return connecting;

  connecting = (async () => {
    try {
      const next = new MongoClient(uri, { serverSelectionTimeoutMS: 4000 });
      await next.connect();
      const database = next.db(dbName);
      await database.command({ ping: 1 });
      await database.collection('orders').createIndex({ id: 1 }, { unique: true });
      await database.collection('orders').createIndex({ number: 1 });
      await database.collection('orders').createIndex({ orderId: 1 }, { unique: true, sparse: true });
      await database.collection('orders').createIndex({ userId: 1 });
      await database.collection('orders').createIndex({ stripePaymentIntentId: 1 }, { unique: true, sparse: true });
      await database.collection('users').createIndex({ email: 1 }, { unique: true });
      await database.collection('users').createIndex({ id: 1 }, { unique: true });
      try {
        await database.collection('users').createIndex({ phone: 1 }, { unique: true, sparse: true });
      } catch (error) {
        console.error('[mongo] unique phone index skipped:', error instanceof Error ? error.message : error);
      }
      await database.collection('otp_challenges').createIndex({ id: 1 }, { unique: true });
      await database.collection('otp_challenges').createIndex({ email: 1, phone: 1 }, { unique: true });
      await database.collection('otp_challenges').createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 });
      await database.collection('products').createIndex({ id: 1 }, { unique: true });
      await database.collection('reviews').createIndex({ id: 1 }, { unique: true });
      await database.collection('reviews').createIndex({ productId: 1, createdAt: -1 });
      try {
        await database.collection('reviews').dropIndex('productId_1_userId_1');
      } catch {
        /* index may already be gone */
      }
      try {
        await database.collection('reviews').createIndex(
          { productId: 1, orderId: 1, userId: 1 },
          {
            unique: true,
            name: 'productId_1_orderId_1_userId_1',
            partialFilterExpression: { orderId: { $type: 'string', $gt: '' } },
          }
        );
      } catch (error) {
        console.error('[mongo] review unique index:', error instanceof Error ? error.message : error);
      }
      await database.collection('reviews').createIndex({ status: 1 });
      await database.collection('return_requests').createIndex({ id: 1 }, { unique: true });
      client = next;
      db = database;
      return database;
    } catch (error) {
      console.error('[mongo] connection failed:', error instanceof Error ? error.message : error);
      client = null;
      db = null;
      return null;
    } finally {
      connecting = null;
    }
  })();

  return connecting;
}

export async function mongoStatus() {
  const database = await getDb();
  return {
    connected: Boolean(database),
    uriHost: uri.replace(/\/\/([^@]+@)?/, '//'),
    db: dbName,
  };
}
