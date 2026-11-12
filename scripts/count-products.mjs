import { MongoClient } from 'mongodb';
import fs from 'fs';

const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
await client.connect();
const db = client.db(process.env.MONGODB_DB || 'clothes');
const col = db.collection('products');
const total = await col.countDocuments({});
const deo = await col.countDocuments({ importedFrom: 'deodap' });
const byCat = await col
  .aggregate([{ $group: { _id: '$category', n: { $sum: 1 } } }, { $sort: { n: -1 } }])
  .toArray();
let pages = 0;
try {
  pages = fs.readdirSync('tmp/deodap-pages').length;
} catch {
  /* ignore */
}
console.log(JSON.stringify({ total, deo, cachedPages: pages, byCat }, null, 2));
await client.close();
