import fs from "fs";
import path from "path";

// Use ./../ because after bundling we end up with src/index.js
const typeDefs = fs.readFileSync(path.join(__dirname, "./../../../schema.graphql")).toString();

export default typeDefs;
