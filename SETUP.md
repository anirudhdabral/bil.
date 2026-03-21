# 🛠️ Bill Manager Setup Guide

## 🚀 Technologies Used

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/) (Google SSO)
- **API**: [GraphQL](https://graphql.org/) (Apollo Server & Client)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/)

Follow these steps to get your local development environment up and running.

## 1. Environment Variables

Create a `.env` file in the root directory (you can use the template below).

```env
# MongoDB Connection
MONGODB_URI="mongodb+srv://..."

# NextAuth Configuration
NEXTAUTH_SECRET="your-random-secret-at-least-32-chars"

# Google OAuth (SSO)
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxx"

# Super Admin Email (automatically approved & admin)
SUPER_ADMIN="your-email@gmail.com"
```

---

## 2. 🗄️ MongoDB Setup

1.  **Create a Cluster**: Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free shared cluster.
2.  **Network Access**: In the "Network Access" tab, click "Add IP Address" and select "Allow Access From Anywhere" (0.0.0.0/0) for development, or add your current IP.
3.  **Database User**: In the "Database Access" tab, create a user with "Read and write to any database" privileges.
4.  **Connection String**: Click "Connect" on your cluster, choose "Connect your application", and copy the URI. 
    - Replace `<password>` with your user's password.
    - Set this as `MONGODB_URI` in your `.env`.

---

## 3. 🔑 Google SSO (OAuth) Setup

1.  **Google Cloud Console**: Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  **Create Project**: Create a new project (e.g., "Bill Manager").
3.  **OAuth Consent Screen**:
    - Go to "APIs & Services" > "OAuth consent screen".
    - Choose "External" and click "Create".
    - Fill in the required App Information (App name, support email, developer contact info).
    - Add the `.../auth/userinfo.email` and `.../auth/userinfo.profile` scopes if prompted.
4.  **Credentials**:
    - Go to "APIs & Services" > "Credentials".
    - Click "Create Credentials" > "OAuth client ID".
    - Application Type: **Web application**.
    - **Authorized JavaScript origins**: `http://localhost:3000`
    - **Authorized redirect URIs**: `http://localhost:3000/api/auth/callback/google`
5.  **Copy Keys**: Copy the **Client ID** and **Client Secret** into your `.env`.

---

## 4. 🚀 Local Development

1.  **Install Dependencies**:
    ```bash
    pnpm install
    ```
2.  **Run Development Server**:
    ```bash
    pnpm dev
    ```
3.  **Access the App**: Open [http://localhost:3000](http://localhost:3000).
4.  **First Login**: Sign in with the email you set as `SUPER_ADMIN`. You will have full access immediately.

---

## 📁 Project Structure

- `app/`: Next.js App Router pages and API routes.
- `components/`: UI components and bill-specific cards/lists.
- `graphql/`: Schema definition and resolvers for the Apollo server.
- `lib/`: Utility functions (auth, database, apollo client).
- `models/`: Mongoose schemas for MongoDB.

---

## 5. ☁️ Deploying to Vercel

1.  **Push to GitHub**: Push your code to a GitHub repository.
2.  **Import Project**: In the [Vercel Dashboard](https://vercel.com/), click "Add New" > "Project" and import your repository. Ensure the **Framework Preset** is set to **Next.js**.
3.  **Environment Variables**: In the "Environment Variables" section during setup (or in Project Settings later), add:
    - `MONGODB_URI`
    - `NEXTAUTH_SECRET`
    - `GOOGLE_CLIENT_ID`
    - `GOOGLE_CLIENT_SECRET`
    - `SUPER_ADMIN`
4.  **Google Console Update**: 
    - Once deployed, copy your Vercel deployment URL (e.g., `https://bill-manager.vercel.app`).
    - Go back to the [Google Cloud Console](https://console.cloud.google.com/).
    - Edit your OAuth 2.0 Client ID.
    - Under **Authorized redirect URIs**, add: `https://your-app-url.vercel.app/api/auth/callback/google`.
    - Under **Authorized JavaScript origins**, add: `https://your-app-url.vercel.app`.
5.  **Build Command**: The default settings should work out of the box (`pnpm install` and `next build`).

