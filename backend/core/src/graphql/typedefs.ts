import fs from "fs";
import path from "path";

// Use ./../ because after bundling we end up with src/index.js
let schemaPath = "./../../../schema.graphql";

if (process.env.JEST_WORKER_ID) {
  schemaPath = "./../../schema.graphql";
}

const typeDefs = fs.readFileSync(path.join(__dirname, schemaPath)).toString();

export default typeDefs;
