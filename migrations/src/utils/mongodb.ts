import { MongoClient } from "mongodb";

export const mongo = new MongoClient(process.env.MONGO_URI!);
export const mongoProd = new MongoClient(process.env.MONGO_URI_PROD!);
