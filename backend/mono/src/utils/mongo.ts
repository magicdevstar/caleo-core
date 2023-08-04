import mongoose, { Connection } from 'mongoose';

let mongo: Connection = null as any;

export default async () => {
  if (!mongo) {
    mongo = mongoose.createConnection(process.env.MONGO_URI!, {
      serverSelectionTimeoutMS: 5000
    });

    await mongo.asPromise();
  }

  return mongo;
};
