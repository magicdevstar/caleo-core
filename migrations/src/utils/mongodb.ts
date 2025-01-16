import { MongoClient } from "mongodb";

export const mongo = new MongoClient(process.env.MONGO_URI!);
export const mongoProd = new MongoClient(process.env.MONGO_URI_PROD!);
// export const mongoLocal = new MongoClient('mongodb://localhost:27017/');
