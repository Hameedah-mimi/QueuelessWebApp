# QueueLess frontend setup

## 1. Install dependencies

```bash
npm install
```

## 2. Configure environment variables

Copy `.env.example` to `.env` and fill in the Firebase web-app configuration from Firebase Console → Project settings → Your apps.

```env
VITE_FIREBASE_API_KEY=your-firebase-web-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Enable Email/Password and Google providers in Firebase Authentication. Never place the Firebase Admin service-account private key in the frontend project. The Admin key belongs only on the Django server.

## 3. Start the app

```bash
npm run dev
```

## Authentication architecture

Email/password registration and login and Google login use Firebase Authentication. After Firebase authenticates a user, the frontend sends the Firebase ID token to `POST /api/v1/auth/firebase/`. Django should verify the token with Firebase Admin SDK, create/update its local user profile using the Firebase UID, and return a `user` object. The Axios client attaches a fresh Firebase ID token as `Authorization: Bearer <token>` to protected API requests. Django JWT refresh tokens are not used by this frontend.

## API endpoints used by the new screens

The existing project already uses `/api/v1/chat/conversations/start/` to start a conversation with an organization. The Messages screen also expects:

- `GET /api/v1/chat/conversations/`
- `GET /api/v1/chat/conversations/<conversation_id>/messages/`
- `POST /api/v1/chat/conversations/<conversation_id>/messages/` with `{ "content": "..." }`
- `POST /api/v1/contact/` with `{ name, email, subject, message }`
- `POST /api/v1/reports/` with `{ target_type, target_id, target_name, reason, details }`
- `GET /api/v1/reports/` for authorized moderators/admins
- `PATCH /api/v1/reports/<report_id>/` with `{ status: "reviewing" | "resolved" | "dismissed" }` for authorized moderators/admins
- `POST /api/v1/organizations/` to create an organization for the signed-in account

Confirm these routes and field names against the current Django backend. The contact and report screens are ready on the frontend, and an admin moderation page is included. These require corresponding Django endpoints, validation, storage, permission checks, and admin review workflows. Do not treat a successful frontend form as a stored report until Django confirms it.

## Security notes

- Do not commit `.env` or private keys.
- Validate ownership and permissions on the Django server for organizations, conversations, messages, reports, and appointments.
- A user must only read or send messages in conversations they belong to.
- Report submissions should be private and visible only to the reporting user and authorized moderation staff.
