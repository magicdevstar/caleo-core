import mongoose, { Connection } from 'mongoose';
import logger from './logger';

let mongo: Connection = null as any;

export default async () => {
  if (!mongo) {
    try {
      mongo = mongoose.createConnection(process.env.MONGO_URI!, {
        serverSelectionTimeoutMS: 5000
      });
  
      await mongo.asPromise();
    } catch(error) {
      logger.error('Error connecting to mongo', { error });
      throw error;
    }
  }

  return mongo;
};
