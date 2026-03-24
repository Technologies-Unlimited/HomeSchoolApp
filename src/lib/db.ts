import { MongoClient, type Db } from "mongodb";

let clientPromise: Promise<MongoClient> | null = null;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function getClientPromise() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("[DB] MONGODB_URI environment variable is missing!");
    throw new Error("Missing MONGODB_URI environment variable.");
  }

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      console.log("[DB] Creating new MongoDB client (development — global singleton)");
      const client = new MongoClient(mongoUri);
      global._mongoClientPromise = client.connect().then((c) => {
        console.log("[DB] MongoDB connected successfully (development)");
        return c;
      });
    }
    return global._mongoClientPromise;
  }

  if (!clientPromise) {
    console.log("[DB] Creating new MongoDB client (production)");
    const client = new MongoClient(mongoUri);
    clientPromise = client.connect().then((c) => {
      console.log("[DB] MongoDB connected successfully (production)");
      return c;
    });
  }
  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  const dbName = process.env.MONGODB_DB_NAME;
  const resolvedDbName = dbName || client.db().databaseName;
  console.log("[DB] getDb() — using database:", resolvedDbName);
  return dbName ? client.db(dbName) : client.db();
}
