# Cloud Migration Guide: MongoDB + Cloudflare R2

This guide outlines how to migrate from SQLite (local) to MongoDB (cloud database) and Cloudflare R2 (cloud storage).

## Current Architecture

**Database:** SQLite (local file: `homeschool.db`)
**File Storage:** Not yet implemented (planned for local file system)

## Target Architecture

**Database:** MongoDB Atlas (cloud)
**File Storage:** Cloudflare R2 (S3-compatible object storage)

---

## Phase 1: Database Migration (SQLite → MongoDB)

### 1. Install MongoDB Driver

```bash
bun add mongodb
```

### 2. Create Database Abstraction Layer

Create `src/db/adapter.ts`:

```typescript
// Database adapter interface
export interface DatabaseAdapter {
  query(sql: string): any;
  prepare(sql: string): any;
  run(sql: string, ...params: any[]): any;
}

// SQLite adapter (current)
export class SQLiteAdapter implements DatabaseAdapter {
  constructor(private db: any) {}
  query(sql: string) { return this.db.query(sql); }
  prepare(sql: string) { return this.db.prepare(sql); }
  run(sql: string, ...params: any[]) { return this.db.run(sql, ...params); }
}

// MongoDB adapter (future)
export class MongoDBAdapter {
  constructor(private client: MongoClient, private dbName: string) {}

  async getCollection(name: string) {
    return this.client.db(this.dbName).collection(name);
  }

  // Convert SQL-like operations to MongoDB operations
  async findOne(collection: string, filter: any) {
    const coll = await this.getCollection(collection);
    return await coll.findOne(filter);
  }

  async find(collection: string, filter: any) {
    const coll = await this.getCollection(collection);
    return await coll.find(filter).toArray();
  }

  async insertOne(collection: string, document: any) {
    const coll = await this.getCollection(collection);
    return await coll.insertOne(document);
  }

  async updateOne(collection: string, filter: any, update: any) {
    const coll = await this.getCollection(collection);
    return await coll.updateOne(filter, { $set: update });
  }
}
```

### 3. Environment Configuration

Add to `.env`:

```bash
# Database Configuration
DATABASE_TYPE=sqlite # or 'mongodb'
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DB_NAME=homeschool

# SQLite (fallback)
SQLITE_PATH=./homeschool.db
```

### 4. MongoDB Schema Design

MongoDB collections (equivalent to SQLite tables):

```javascript
// users collection
{
  _id: ObjectId,
  email: String (unique index),
  phone: String,
  password_hash: String,
  first_name: String,
  last_name: String,
  role: String, // enum: user, event_creator, admin, super_admin
  is_active: Boolean,
  created_at: Date,
  updated_at: Date,
  last_login: Date
}

// events collection
{
  _id: ObjectId,
  title: String,
  description: String,
  creator_id: ObjectId (ref: users),
  status: String, // enum: draft, pending, published, cancelled
  category: String,
  start_date: Date,
  end_date: Date,
  location: {
    name: String,
    address: String
  },
  max_attendees: Number,
  current_attendees: Number,
  cost: String,
  age_range: {
    type: String, // 'age' or 'grade'
    min: Mixed, // Number for age, String for grade
    max: Mixed
  },
  registration_deadline: Date,
  custom_fields: [{
    label: String,
    value: String
  }],
  attachment: {
    filename: String,
    path: String, // R2 URL
    upload_date: Date
  },
  approved_by: ObjectId (ref: users),
  approved_at: Date,
  created_at: Date,
  updated_at: Date
}
```

---

## Phase 2: File Storage Migration (Local → Cloudflare R2)

### 1. Install Cloudflare R2 SDK

```bash
bun add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### 2. Cloudflare R2 Configuration

Add to `.env`:

```bash
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=homeschool-attachments
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

### 3. Create Storage Abstraction Layer

Create `src/storage/adapter.ts`:

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface StorageAdapter {
  uploadFile(file: File, key: string): Promise<string>;
  getFileUrl(key: string): Promise<string>;
  deleteFile(key: string): Promise<void>;
}

// Local file system adapter (current - to be implemented)
export class LocalStorageAdapter implements StorageAdapter {
  constructor(private uploadDir: string) {}

  async uploadFile(file: File, key: string): Promise<string> {
    const filePath = path.join(this.uploadDir, key);
    await Bun.write(filePath, await file.arrayBuffer());
    return `/uploads/${key}`;
  }

  async getFileUrl(key: string): Promise<string> {
    return `/uploads/${key}`;
  }

  async deleteFile(key: string): Promise<void> {
    const filePath = path.join(this.uploadDir, key);
    await fs.unlink(filePath);
  }
}

// Cloudflare R2 adapter (future)
export class R2StorageAdapter implements StorageAdapter {
  private s3Client: S3Client;
  private bucketName: string;
  private publicUrl: string;

  constructor() {
    this.bucketName = process.env.R2_BUCKET_NAME!;
    this.publicUrl = process.env.R2_PUBLIC_URL!;

    this.s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }

  async uploadFile(file: File, key: string): Promise<string> {
    const buffer = await file.arrayBuffer();

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: new Uint8Array(buffer),
        ContentType: file.type,
      })
    );

    return `${this.publicUrl}/${key}`;
  }

  async getFileUrl(key: string): Promise<string> {
    // For public files
    return `${this.publicUrl}/${key}`;

    // For private files with signed URL (expires in 1 hour)
    // const command = new GetObjectCommand({
    //   Bucket: this.bucketName,
    //   Key: key,
    // });
    // return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }

  async deleteFile(key: string): Promise<void> {
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      })
    );
  }
}
```

### 4. File Upload API Implementation

Update `server.ts`:

```typescript
// Initialize storage adapter based on environment
const storage = process.env.STORAGE_TYPE === 'r2'
  ? new R2StorageAdapter()
  : new LocalStorageAdapter('./uploads');

// File upload endpoint
if (path === "/api/events/upload" && method === "POST") {
  try {
    const user = getUserFromRequest(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return jsonResponse({ error: "No file provided" }, 400);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `events/${timestamp}_${safeFilename}`;

    // Upload file
    const fileUrl = await storage.uploadFile(file, key);

    return jsonResponse({
      success: true,
      filename: file.name,
      url: fileUrl,
      key
    });
  } catch (error) {
    console.error("File upload error:", error);
    return jsonResponse({ error: "File upload failed" }, 500);
  }
}
```

---

## Migration Steps

### Step 1: Backup Current Data

```bash
# Backup SQLite database
cp homeschool.db homeschool.db.backup
```

### Step 2: Export Data from SQLite

Create `scripts/export-to-mongodb.ts`:

```typescript
import { Database } from "bun:sqlite";
import { MongoClient } from "mongodb";

const sqlite = new Database("homeschool.db");
const mongoUrl = process.env.MONGODB_URI!;
const client = new MongoClient(mongoUrl);

async function migrate() {
  await client.connect();
  const db = client.db(process.env.MONGODB_DB_NAME);

  // Migrate users
  const users = sqlite.query("SELECT * FROM users").all();
  if (users.length > 0) {
    await db.collection("users").insertMany(users);
  }

  // Migrate events (convert SQLite format to MongoDB format)
  const events = sqlite.query("SELECT * FROM events").all();
  const transformedEvents = events.map(e => ({
    title: e.title,
    description: e.description,
    creator_id: e.creator_id,
    status: e.status,
    // ... transform other fields
    location: {
      name: e.location_name,
      address: e.location_address
    },
    age_range: {
      type: e.age_range_type,
      min: e.age_range_type === 'age' ? e.age_min : e.grade_min,
      max: e.age_range_type === 'age' ? e.age_max : e.grade_max
    },
    custom_fields: e.custom_fields ? JSON.parse(e.custom_fields) : []
  }));

  if (transformedEvents.length > 0) {
    await db.collection("events").insertMany(transformedEvents);
  }

  // Migrate other collections...

  console.log("✅ Migration completed!");
  await client.close();
}

migrate().catch(console.error);
```

### Step 3: Switch Environment Variables

Update `.env`:

```bash
DATABASE_TYPE=mongodb
STORAGE_TYPE=r2
```

### Step 4: Test in Development

```bash
bun run dev
# Test all features to ensure they work with MongoDB and R2
```

### Step 5: Deploy to Production

- Set up MongoDB Atlas cluster
- Set up Cloudflare R2 bucket
- Configure environment variables in production
- Deploy application

---

## Benefits of Cloud Migration

### MongoDB Atlas
- ✅ Automatic scaling
- ✅ Built-in replication and backup
- ✅ Global distribution
- ✅ Better query performance for large datasets
- ✅ Flexible schema for evolving requirements

### Cloudflare R2
- ✅ No egress fees (unlike AWS S3)
- ✅ S3-compatible API
- ✅ Global CDN distribution
- ✅ Automatic image optimization
- ✅ Cost-effective storage ($0.015/GB/month)

---

## Cost Estimates

### MongoDB Atlas
- **Free Tier:** 512 MB storage (perfect for starting)
- **M10 Cluster:** ~$57/month (2GB RAM, 10GB storage)

### Cloudflare R2
- **Free Tier:** 10 GB storage, 1 million Class A ops/month
- **Beyond Free:** $0.015/GB/month storage

**Total estimated cost for small deployment:** $0-10/month (free tiers)
**Total estimated cost for medium deployment:** ~$60-80/month

---

## Current Status

✅ **Implemented:**
- User management (admin panel)
- Database schema updated for file attachments
- Ready for abstraction layer implementation

⏳ **Next Steps:**
- Implement file upload UI in event creation
- Add storage abstraction layer
- Implement download/print functionality
- Create migration scripts
