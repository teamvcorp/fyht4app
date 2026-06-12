import { MongoClient, type Db } from "mongodb";

// Serverless-safe MongoClient singleton. In development we cache the connection
// promise on the global object so HMR doesn't open a new connection on every
// reload; in production each lambda gets its own client.

const uri = process.env.MONGODB_URI;
const options = {};

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function buildClientPromise(): Promise<MongoClient> {
  if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable");
  }
  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = new MongoClient(uri, options).connect();
    }
    return global._mongoClientPromise;
  }
  return new MongoClient(uri, options).connect();
}

// Exported for the Auth.js MongoDB adapter, which expects a Promise<MongoClient>.
const clientPromise: Promise<MongoClient> = buildClientPromise();
export default clientPromise;

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB || "fyht4");
}
