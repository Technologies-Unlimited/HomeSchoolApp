# Home School Group - Event Management Platform

A comprehensive event management system for homeschool groups with calendar integration, dynamic forms, user authentication, and collaborative features.

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [User Roles & Permissions](#user-roles--permissions)
- [Feature Specifications](#feature-specifications)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Development Setup](#development-setup)
- [Deployment](#deployment)

## Overview

This platform enables homeschool groups to manage events, coordinate activities, and build community. It provides a Facebook-like event experience with calendar integration, dynamic signup forms, commenting system, and granular permission controls.

## Core Features

### 1. Calendar System
- **Google Calendar Integration**: Import or embed existing Google Calendar
- **Custom Calendar View**: Month, week, and day views
- **Event Display**: Visual calendar with clickable events
- **Export Functionality**: Users can export events to their personal calendars (.ics format)
- **Responsive Design**: Works on desktop, tablet, and mobile

### 2. Event Management
- **Create Events**: Users can create events with details (title, description, date, time, location)
- **Event Detail Pages**: Dedicated page for each event with all information
- **Draft System**: Events require admin approval before publishing
- **Edit Capabilities**: Based on user permissions
- **Delete Events**: Admin-only or creator-based permissions
- **Event Status**: Draft, Pending Approval, Published, Cancelled

### 3. Dynamic Form System
- **Optional Event Forms**: Optionally attach custom signup forms to events
- **Admin Form Builder**: UI to add/remove/configure form fields
- **Field Types**: Text, number, email, dropdown, checkbox, textarea, file upload
- **Common Fields**: Parent names, child ages, allergies, dietary restrictions, etc.
- **Private Form Responses**: Only event creator and admins can view responses
- **Response Management**: View, filter, and export form submissions (CSV)
- **Post-Event Surveys**: Optional feedback forms that can be attached after event concludes

### 4. Comments & Discussions
- **Public Event Comments**: Facebook-style public commenting on events
- **Threaded Replies**: All users can reply to comments
- **Real-time Updates**: New comments appear without page refresh
- **Notifications**: Alert users when someone replies to their comment
- **Community Discussion**: Everyone can see and participate in event discussions

### 5. RSVP & Attendance
- **Quick RSVP**: One-click "I'm attending" button
- **Attendance Status**: Going, Maybe, Can't Go
- **Optional Comments**: Add notes when RSVPing
- **Attendance Count**: Display number of attendees
- **Attendee List**: See who else is going

### 6. User Authentication & Accounts
- **Required Signup Fields**: Email, phone number, first name, last name, password
- **MongoDB Database**: Store user data, events, forms, comments
- **Email/Password Login**: Secure authentication
- **User Profiles**: Edit name, phone, family information
- **Session Management**: Persistent login with JWT tokens
- **Password Reset**: Email-based password recovery
- **Privacy**: Only names displayed publicly - email/phone kept private

### 7. Permission System
Four permission levels with hierarchical access:

#### **Super Admin** (Owner/Founder)
- Full system access
- Create, edit, delete ANY event
- Manage all users and permissions
- Configure platform settings
- Approve/reject event submissions
- Delete any comments (moderation)
- View ALL form responses for all events (private data)
- Access admin dashboard

#### **Admin**
- Create events (auto-published, no approval needed)
- Edit and delete ANY event
- Approve/reject events from Event Creators
- View ALL form responses for all events (private data)
- Delete inappropriate comments (moderation)
- View analytics

#### **Event Creator**
- Create events (requires admin approval)
- Edit ONLY their own events
- View form responses for ONLY their events (private data)
- Create and manage forms for their events
- Comment and reply to comments (public discussion)
- Delete comments on their own events (moderation)
- Cannot delete published events without admin

#### **Regular User** (Default)
- View published events
- RSVP to events
- Fill out event signup forms (responses are private)
- Comment and reply on events (public discussion)
- View all public comments
- Cannot view other users' form responses
- Export events to personal calendar

## Tech Stack

### Frontend
- **Bun**: Runtime and dev server with fast refresh
- **TypeScript**: Type-safe development
- **Custom CSS-in-JS**: Lightweight styling solution
- **Vanilla JS/TS**: No heavy framework overhead

### Backend
- **Bun**: HTTP server and API
- **MongoDB**: Database for users, events, forms, comments
- **Mongoose**: MongoDB ODM for schema validation
- **JWT**: Authentication tokens
- **bcrypt**: Password hashing

### Calendar Integration
- **FullCalendar**: Interactive calendar component
- **Google Calendar API**: Import/sync Google Calendar
- **iCal**: Export events in universal format

### Deployment
- **Vercel**: Frontend and serverless functions
- **MongoDB Atlas**: Cloud database
- **Vercel Blob/S3**: File storage for attachments

## User Roles & Permissions

| Feature | Super Admin | Admin | Event Creator | Regular User |
|---------|------------|-------|---------------|--------------|
| Create Event | ✅ Auto-publish | ✅ Auto-publish | ✅ Needs approval | ❌ |
| Edit Own Event | ✅ | ✅ | ✅ | ❌ |
| Edit Any Event | ✅ | ✅ | ❌ | ❌ |
| Delete Own Event | ✅ | ✅ | ⚠️ Draft only | ❌ |
| Delete Any Event | ✅ | ✅ | ❌ | ❌ |
| Approve Events | ✅ | ✅ | ❌ | ❌ |
| Manage Users | ✅ | ❌ | ❌ | ❌ |
| Manage Permissions | ✅ | ❌ | ❌ | ❌ |
| View Events | ✅ | ✅ | ✅ | ✅ |
| RSVP to Events | ✅ | ✅ | ✅ | ✅ |
| View Comments | ✅ Public | ✅ Public | ✅ Public | ✅ Public |
| Create Comments | ✅ | ✅ | ✅ | ✅ |
| Reply to Comments | ✅ | ✅ | ✅ | ✅ |
| Delete Own Comments | ✅ | ✅ | ✅ | ✅ |
| Delete Any Comment | ✅ | ✅ | ✅ Own events | ❌ |
| Fill Out Forms | ✅ | ✅ | ✅ | ✅ |
| View Form Responses | ✅ All events | ✅ All events | ✅ Own events | ❌ Private |
| Create/Edit Forms | ✅ | ✅ | ✅ Own events | ❌ |
| Export Form Data | ✅ All | ✅ All | ✅ Own events | ❌ |

## User Registration & Privacy

### Registration Form
When users sign up, they must provide:

```
┌─────────────────────────────────────┐
│     Create Your Account             │
├─────────────────────────────────────┤
│ First Name *                        │
│ [________________]                  │
│                                     │
│ Last Name *                         │
│ [________________]                  │
│                                     │
│ Email Address *                     │
│ [________________]                  │
│                                     │
│ Phone Number *                      │
│ [________________]                  │
│                                     │
│ Password * (min 8 characters)       │
│ [________________]                  │
│                                     │
│ Confirm Password *                  │
│ [________________]                  │
│                                     │
│ [✓] I agree to Terms & Privacy      │
│                                     │
│        [Create Account]             │
└─────────────────────────────────────┘

* Required fields
```

### Display Privacy Rules

**What Users See Publicly:**
- **Comments**: "Sarah Johnson" or "Mike Davis"
- **Event Creator**: "Created by: Sarah Johnson"
- **RSVP List**: "Sarah Johnson, Mike Davis, Emily Parker"
- **Form Responses**: Only visible to event owner/admins

**What is NEVER Shown Publicly:**
- ❌ Email addresses
- ❌ Phone numbers
- ❌ Full contact information

**Who Can See Private Information:**
- **Super Admins**: Can view all user contact info
- **Event Creators**: Can view contact info of users who filled out their event forms
- **Users Themselves**: Can view/edit their own profile

### API Response Examples

**Public API (comments, events, etc.):**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "userName": "Sarah Johnson",
  "comment": "Looking forward to this event!"
}
```

**Private API (user profile, admin panel):**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "firstName": "Sarah",
  "lastName": "Johnson",
  "email": "sarah.johnson@email.com",
  "phone": "(555) 123-4567",
  "role": "user"
}
```

## Feature Specifications

### Calendar Features

#### Display Modes
```
- Month View: Full month grid with events
- Week View: 7-day detailed schedule
- Day View: Hourly breakdown
- List View: Upcoming events list
```

#### Event Indicators
```
- Color coding by category
- Draft badge (visible to creator/admins only)
- Pending approval badge
- Number of attendees badge
```

#### Actions
```
- Click event → Open detail page
- Drag & drop to reschedule (admin only)
- Filter by category, creator, status
```

### Event Detail Page

#### Layout
```
┌─────────────────────────────────────┐
│ Event Title                     [Edit] [Delete] │
├─────────────────────────────────────┤
│ 📅 Date & Time                      │
│ 📍 Location                         │
│ 👤 Created by: [Name]              │
│ 📊 Status: Published/Draft          │
├─────────────────────────────────────┤
│ Description                         │
│ [Full event description text...]    │
├─────────────────────────────────────┤
│ ✅ RSVP Section                     │
│ [Going] [Maybe] [Can't Go]          │
│ 12 people attending                 │
├─────────────────────────────────────┤
│ 📝 Event Signup Form                │
│ [Dynamic form fields appear here]   │
│ [Submit Response]                   │
├─────────────────────────────────────┤
│ 💬 Comments & Discussion (12)       │
│ ┌─────────────────────────────────┐ │
│ │ Sarah Johnson   2 hours ago  ❤️3│ │
│ │ "Is this suitable for ages 5+?" │ │
│ │ [Like] [Reply]                  │ │
│ │   └─ Event Owner: "Absolutely! │ │
│ │      Perfect for 5-12 year olds"│ │
│ │                                 │ │
│ │ Mike Davis     1 hour ago       │ │
│ │ "Can I bring a guest?"          │ │
│ │ [Like] [Reply]                  │ │
│ │   └─ Sarah: "I'm bringing one!"│ │
│ │                                 │ │
│ │ Emily Parker   30 mins ago      │ │
│ │ "Looking forward to this! 🎉"   │ │
│ │ [Like] [Reply]                  │ │
│ └─────────────────────────────────┘ │
│ [Write a comment...]                │
└─────────────────────────────────────┘
Note: Form responses (allergies, ages, etc.)
are PRIVATE - only event owner/admins see them
```

### Dynamic Form Builder

#### Form Types

**1. Signup Form (Pre-Event)**
- Attached to event before it occurs
- Collects registration information (names, ages, allergies, etc.)
- Visible immediately when event is published
- Users fill out when RSVPing

**2. Post-Event Survey (After Event)**
- Event creator can optionally attach after event concludes
- Collects feedback, ratings, suggestions
- Only shown to users who attended (marked as "Going")
- Can ask questions like "How was the event?" "What could be improved?"

**Privacy Note:** All form responses (both types) are PRIVATE and only visible to event creator and admins. Public discussion happens in comments.

#### Admin Interface
```
Create/Edit Event Form:
Form Type: [Signup Form ▼] [Post-Event Survey]

Form Fields:
┌─────────────────────────────────────┐
│ Field 1: Parent Name(s)             │
│ Type: [Text Input] [Required ✓]    │
│ [Remove]                            │
├─────────────────────────────────────┤
│ Field 2: Children's Ages            │
│ Type: [Text Input] [Required ✓]    │
│ [Remove]                            │
├─────────────────────────────────────┤
│ Field 3: Allergies/Dietary          │
│ Type: [Textarea] [Required ✗]      │
│ [Remove]                            │
├─────────────────────────────────────┤
│ Field 4: T-Shirt Size              │
│ Type: [Dropdown ▼] [Required ✓]   │
│ Options: S, M, L, XL               │
│ [Remove]                            │
└─────────────────────────────────────┘

[+ Add Field]

Field Types:
- Short Text
- Long Text (Textarea)
- Number
- Email
- Phone
- Dropdown Select
- Multiple Choice (Radio)
- Checkboxes
- Date
- File Upload
```

#### Form Response Management
```
Event: "Summer Picnic 2025"
Responses: 12

┌─────────────────────────────────────┐
│ Filter: [All] [Needs Review]       │
├─────────────────────────────────────┤
│ Sarah Johnson - Submitted 3 days ago│
│ Parent: Sarah & Mike Johnson        │
│ Ages: 7, 9, 11                      │
│ Allergies: Peanuts                  │
│ [View Details] [Export]             │
├─────────────────────────────────────┤
│ Emily Davis - Submitted 2 days ago  │
│ ...                                 │
└─────────────────────────────────────┘

[Export All Responses (CSV)]
```

### Event Approval Workflow

```
Event Creator creates event
        ↓
    [DRAFT status]
        ↓
Creator clicks "Submit for Approval"
        ↓
  [PENDING status]
        ↓
Admin receives notification
        ↓
Admin reviews event
        ↓
    ┌───┴───┐
    ↓       ↓
Approve   Reject
    ↓       ↓
Published  Back to Draft
           (with feedback)
```

### Comment System

#### Public Discussion
**Comments are fully public - similar to Facebook event discussions:**
- All users can view all comments on any event
- All users can create comments and reply to others
- Threaded conversation support
- Real-time updates when new comments appear
- Event owners and admins can moderate (delete inappropriate comments)

#### Features
- Public commenting and discussion
- Markdown support for formatting
- Threaded replies - anyone can reply to any comment
- @mentions to notify specific users
- Like/reaction buttons
- Sort by newest/oldest/most liked
- Edit own comments (5 min window)
- Delete own comments
- Event owners can delete comments on their events (moderation)
- Admins can delete any comment (moderation)
- Report inappropriate comments

#### Comment Structure
```typescript
{
  id: string
  eventId: string
  userId: string
  userName: string  // Full name: "firstName lastName" (e.g., "Sarah Johnson")
                    // Email and phone are NOT stored or displayed
  content: string
  parentCommentId?: string  // For replies
  createdAt: Date
  updatedAt: Date
  likes: number
  edited: boolean
}
```

### RSVP System

#### User Flow
```
1. User opens event detail page
2. Sees RSVP section
3. Clicks status: Going/Maybe/Can't Go
4. Optional: Adds comment with RSVP
5. System records response
6. Attendee count updates
7. User receives confirmation
```

#### RSVP Data
```typescript
{
  userId: string
  eventId: string
  status: 'going' | 'maybe' | 'not-going'
  comment?: string
  formSubmitted: boolean
  formResponseId?: string
  updatedAt: Date
}
```

## Database Schema

### Users Collection
```typescript
{
  _id: ObjectId
  email: string (unique, required)  // PRIVATE - not displayed publicly
  phone: string (required)  // PRIVATE - not displayed publicly
  passwordHash: string (required)
  firstName: string (required)  // PUBLIC - displayed in comments, events, etc.
  lastName: string (required)  // PUBLIC - displayed in comments, events, etc.
  role: 'super_admin' | 'admin' | 'event_creator' | 'user'
  familyInfo: {
    childrenAges?: number[]
    allergies?: string
    preferences?: string
  }
  createdAt: Date
  updatedAt: Date
  lastLogin: Date
  isActive: boolean
  notifications: {
    email: boolean
    eventReminders: boolean
    comments: boolean
  }
}
```

### Events Collection
```typescript
{
  _id: ObjectId
  title: string (required)
  description: string
  creatorId: ObjectId (ref: Users)
  status: 'draft' | 'pending' | 'published' | 'cancelled'
  category: string
  startDate: Date (required)
  endDate: Date
  location: {
    name: string
    address: string
    coordinates?: { lat: number, lng: number }
  }
  maxAttendees?: number
  currentAttendees: number
  imageUrl?: string
  googleCalendarId?: string
  formId?: ObjectId (ref: Forms)
  approvedBy?: ObjectId (ref: Users)
  approvedAt?: Date
  rejectionReason?: string
  createdAt: Date
  updatedAt: Date
  tags: string[]
}
```

### Forms Collection
```typescript
{
  _id: ObjectId
  eventId: ObjectId (ref: Events)
  creatorId: ObjectId (ref: Users)
  formType: 'signup' | 'post-event-survey'  // When form is available
  isActive: boolean  // Can be toggled on/off
  fields: [
    {
      id: string
      label: string
      type: 'text' | 'textarea' | 'number' | 'email' | 'select' | 'radio' | 'checkbox' | 'date' | 'file'
      required: boolean
      options?: string[]  // For select/radio/checkbox
      placeholder?: string
      validation?: {
        min?: number
        max?: number
        pattern?: string
      }
    }
  ]
  createdAt: Date
  updatedAt: Date
}
```

### Form Responses Collection
```typescript
{
  _id: ObjectId
  formId: ObjectId (ref: Forms)
  eventId: ObjectId (ref: Events)
  userId: ObjectId (ref: Users)
  responses: {
    fieldId: string
    value: any
  }[]
  submittedAt: Date
  updatedAt: Date
}
```

### RSVPs Collection
```typescript
{
  _id: ObjectId
  eventId: ObjectId (ref: Events)
  userId: ObjectId (ref: Users)
  status: 'going' | 'maybe' | 'not-going'
  comment?: string
  formResponseId?: ObjectId (ref: FormResponses)
  createdAt: Date
  updatedAt: Date
}
```

### Comments Collection
```typescript
{
  _id: ObjectId
  eventId: ObjectId (ref: Events)
  userId: ObjectId (ref: Users)
  content: string (required)
  parentCommentId?: ObjectId (ref: Comments)  // For threaded replies
  likes: number
  edited: boolean
  createdAt: Date
  updatedAt: Date
  isDeleted: boolean
  deletedBy?: ObjectId (ref: Users)
}
```

### Notifications Collection
```typescript
{
  _id: ObjectId
  userId: ObjectId (ref: Users)
  type: 'event_approved' | 'event_rejected' | 'comment_reply' | 'event_reminder' | 'rsvp_confirmation'
  eventId?: ObjectId (ref: Events)
  commentId?: ObjectId (ref: Comments)
  message: string
  read: boolean
  createdAt: Date
}
```

## API Endpoints

### Authentication
```
POST   /api/auth/register          - Create new user account
                                    Required fields:
                                    - email (unique)
                                    - phone
                                    - firstName
                                    - lastName
                                    - password (min 8 characters)
POST   /api/auth/login             - Login with email/password
POST   /api/auth/logout            - Logout current user
POST   /api/auth/refresh           - Refresh JWT token
POST   /api/auth/forgot-password   - Request password reset
POST   /api/auth/reset-password    - Reset password with token
GET    /api/auth/me                - Get current user info
                                    Returns: firstName, lastName, email, phone, role
                                    (Note: Public API calls only return firstName + lastName)
```

### Users
```
GET    /api/users                  - List users (admin only)
GET    /api/users/:id              - Get user by ID
PATCH  /api/users/:id              - Update user profile
PATCH  /api/users/:id/role         - Change user role (super_admin only)
DELETE /api/users/:id              - Deactivate user (super_admin only)
```

### Events
```
GET    /api/events                 - List all published events
GET    /api/events/pending         - List pending events (admin only)
GET    /api/events/drafts          - List user's draft events
GET    /api/events/:id             - Get event details
POST   /api/events                 - Create new event
PATCH  /api/events/:id             - Update event
DELETE /api/events/:id             - Delete event
POST   /api/events/:id/submit      - Submit event for approval
POST   /api/events/:id/approve     - Approve event (admin only)
POST   /api/events/:id/reject      - Reject event (admin only)
POST   /api/events/:id/publish     - Publish event (admin only)
GET    /api/events/:id/attendees   - Get attendee list
GET    /api/events/:id/export      - Export event as .ics file
```

### Forms
```
GET    /api/forms/:eventId         - Get form structure for event (public)
POST   /api/forms                  - Create form for event (event creator/admin)
PATCH  /api/forms/:id              - Update form (event creator/admin)
DELETE /api/forms/:id              - Delete form (event creator/admin)
POST   /api/forms/:id/respond      - Submit form response (authenticated users)
GET    /api/forms/:id/responses    - Get form responses (PRIVATE - event owner/admin only)
GET    /api/forms/:id/export       - Export responses as CSV (PRIVATE - event owner/admin only)
PATCH  /api/forms/:id/type         - Change form type (signup/post-event-survey)
```

### RSVPs
```
GET    /api/rsvps/:eventId         - Get RSVPs for event
POST   /api/rsvps                  - Create/update RSVP
DELETE /api/rsvps/:eventId         - Remove RSVP
```

### Comments
```
GET    /api/comments/:eventId      - Get all comments for event (public)
POST   /api/comments               - Create comment (all authenticated users)
POST   /api/comments/:id/reply     - Reply to comment (all authenticated users)
PATCH  /api/comments/:id           - Edit comment (own only, 5 min window)
DELETE /api/comments/:id           - Delete comment (own, or event owner, or admin)
POST   /api/comments/:id/like      - Like/unlike comment
POST   /api/comments/:id/report    - Report inappropriate comment
```

### Calendar
```
GET    /api/calendar/sync          - Sync with Google Calendar
POST   /api/calendar/import        - Import Google Calendar
GET    /api/calendar/export        - Export all events as .ics
```

### Notifications
```
GET    /api/notifications          - Get user notifications
PATCH  /api/notifications/:id/read - Mark notification as read
PATCH  /api/notifications/read-all - Mark all as read
```

## Development Setup

### Prerequisites
- Bun 1.3.2 or higher
- MongoDB (local or Atlas account)
- Google Calendar API credentials (optional)

### Installation

1. **Clone or navigate to project**
   ```bash
   cd home-school-group
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Environment variables**

   Create `.env` file:
   ```env
   # Server
   PORT=3000
   NODE_ENV=development

   # MongoDB
   MONGODB_URI=mongodb://localhost:27017/homeschool-group
   # Or for MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/homeschool-group

   # JWT
   JWT_SECRET=your-super-secret-key-change-this
   JWT_EXPIRES_IN=7d

   # Email (for password reset, notifications)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password

   # Google Calendar (optional)
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/callback

   # Frontend URL
   FRONTEND_URL=http://localhost:3000
   ```

4. **Initialize database**
   ```bash
   bun run db:seed
   ```

   This creates:
   - Super admin account:
     - Email: admin@homeschool.com
     - Password: admin123
     - Name: Admin User
     - Phone: (555) 000-0000
   - Sample events
   - Sample users (with full name, email, phone)

5. **Start development server**
   ```bash
   bun run dev
   ```

   Server runs at `http://localhost:3000`

### Project Structure

```
home-school-group/
├── src/
│   ├── api/                    # API routes
│   │   ├── auth.ts
│   │   ├── events.ts
│   │   ├── forms.ts
│   │   ├── rsvps.ts
│   │   ├── comments.ts
│   │   └── users.ts
│   ├── components/             # UI components
│   │   ├── calendar/
│   │   │   ├── Calendar.ts
│   │   │   ├── EventCard.ts
│   │   │   └── MonthView.ts
│   │   ├── events/
│   │   │   ├── EventDetail.ts
│   │   │   ├── EventForm.ts
│   │   │   └── EventList.ts
│   │   ├── forms/
│   │   │   ├── FormBuilder.ts
│   │   │   ├── FormRenderer.ts
│   │   │   └── FormResponses.ts
│   │   ├── comments/
│   │   │   ├── CommentList.ts
│   │   │   ├── CommentItem.ts
│   │   │   └── CommentForm.ts
│   │   └── common/
│   │       ├── Button.ts
│   │       ├── Modal.ts
│   │       └── Input.ts
│   ├── db/                     # Database
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── Event.ts
│   │   │   ├── Form.ts
│   │   │   ├── FormResponse.ts
│   │   │   ├── RSVP.ts
│   │   │   ├── Comment.ts
│   │   │   └── Notification.ts
│   │   ├── connect.ts
│   │   └── seed.ts
│   ├── middleware/             # Express middleware
│   │   ├── auth.ts
│   │   ├── permissions.ts
│   │   └── validation.ts
│   ├── utils/                  # Utilities
│   │   ├── jwt.ts
│   │   ├── email.ts
│   │   ├── validation.ts
│   │   └── calendar.ts
│   ├── types/                  # TypeScript types
│   │   └── index.ts
│   ├── styles/                 # CSS-in-JS styles
│   │   └── theme.ts
│   └── main.ts                 # Frontend entry
├── public/                     # Static assets
├── server.ts                   # Bun server
├── package.json
├── tsconfig.json
├── .env
├── .gitignore
└── README.md
```

## Development Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [ ] Set up project structure
- [ ] Configure MongoDB connection
- [ ] Implement user authentication (register, login, JWT)
- [ ] Create database models
- [ ] Build basic API endpoints
- [ ] Create user permission middleware

### Phase 2: Event Management (Weeks 3-4)
- [ ] Build event CRUD operations
- [ ] Implement event approval workflow
- [ ] Create event detail page
- [ ] Add draft/pending/published status system
- [ ] Build event list and filtering

### Phase 3: Calendar Integration (Week 5)
- [ ] Integrate FullCalendar component
- [ ] Display events on calendar
- [ ] Add month/week/day views
- [ ] Implement event export (.ics)
- [ ] Optional: Google Calendar sync

### Phase 4: Dynamic Forms (Weeks 6-7)
- [ ] Build form builder UI
- [ ] Create form field components
- [ ] Implement form validation
- [ ] Store form responses
- [ ] Build response viewer
- [ ] Add CSV export

### Phase 5: RSVP System (Week 8)
- [ ] Create RSVP UI component
- [ ] Track attendance status
- [ ] Link RSVPs to form responses
- [ ] Display attendee counts
- [ ] Build attendee list

### Phase 6: Comments & Discussions (Week 9)
- [ ] Build comment component
- [ ] Implement threaded replies
- [ ] Add real-time updates
- [ ] Create notification system
- [ ] Add like/reaction feature

### Phase 7: Admin Dashboard (Week 10)
- [ ] Build admin overview page
- [ ] Event approval interface
- [ ] User management panel
- [ ] Analytics and reports
- [ ] Form response management

### Phase 8: Polish & Testing (Weeks 11-12)
- [ ] Responsive design optimization
- [ ] Cross-browser testing
- [ ] Performance optimization
- [ ] Security audit
- [ ] User acceptance testing
- [ ] Bug fixes

### Phase 9: Deployment (Week 13)
- [ ] Set up MongoDB Atlas
- [ ] Configure Vercel deployment
- [ ] Environment variables setup
- [ ] Domain configuration
- [ ] SSL setup
- [ ] Production testing

## Deployment

### Vercel Deployment

1. **Prepare MongoDB Atlas**
   ```bash
   # Create MongoDB Atlas cluster
   # Get connection string
   # Update MONGODB_URI in Vercel env vars
   ```

2. **Configure Vercel**
   ```bash
   bunx vercel login
   bunx vercel link
   ```

3. **Set environment variables**
   ```bash
   bunx vercel env add MONGODB_URI
   bunx vercel env add JWT_SECRET
   bunx vercel env add SMTP_HOST
   # ... add all env vars
   ```

4. **Deploy**
   ```bash
   bunx vercel deploy --prod
   ```

5. **Post-deployment**
   - Create super admin account via seed script
   - Test authentication flow
   - Verify database connections
   - Test event creation/approval
   - Check email notifications

## Security Considerations

- [ ] Password hashing with bcrypt (10+ rounds)
- [ ] JWT token expiration and refresh
- [ ] Input validation and sanitization
- [ ] SQL injection prevention (MongoDB)
- [ ] XSS protection
- [ ] CSRF tokens for forms
- [ ] Rate limiting on API endpoints
- [ ] File upload validation
- [ ] HTTPS only in production
- [ ] Environment variable protection
- [ ] **User Privacy Protection:**
  - [ ] Email addresses never exposed in public API responses
  - [ ] Phone numbers never exposed in public API responses
  - [ ] Only firstName + lastName displayed publicly
  - [ ] Validate phone number format during registration
  - [ ] Email verification (optional but recommended)

## Future Enhancements

- Mobile app (React Native)
- Push notifications
- Email reminders for events
- Recurring events
- Event templates
- Photo galleries for past events
- Group messaging
- Payment integration for paid events
- Attendance tracking via QR codes
- Integration with other calendar services (Outlook, Apple Calendar)
- Advanced analytics dashboard
- Event capacity management
- Waitlist functionality

## Support & Documentation

For development questions or issues:
1. Check this README
2. Review code comments
3. Check the `/docs` folder (coming soon)
4. Contact the development team

## License

Private - Home School Group Internal Use Only

---

**Built with Bun + TypeScript + MongoDB**

Last Updated: 2025-11-28
