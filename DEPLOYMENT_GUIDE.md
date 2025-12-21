# 🌍 Deployment Guide

Since I am an AI running on your local machine, I cannot deploy this project to a cloud provider (like Vercel, Render, or AWS) without access to your personal accounts and API keys.

However, I have configured the project to be **Deploy Ready**.

## Option 1: Temporary Live Link (Local Hosting)
If you just need a link for a demo/presentation right now, you can use `localtunnel` to expose your running localhost ports to the world.

1.  **Expose Backend**:
    ```bash
    npx localtunnel --port 3000
    ```
    *Copy the URL provided (e.g., https://warm-cat.loca.lt)*

2.  **Update Frontend Config**:
    *   Open `frontend/src/App.jsx`.
    *   Replace `http://localhost:3000/api/articles` with the backend URL from step 1.

3.  **Expose Frontend**:
    ```bash
    npx localtunnel --port 5175
    ```
    *Share this URL as your Live Link.*

---

## Option 2: Permanent Cloud Deployment

### 1. Backend (Node + SQLite)
Since this project uses **SQLite** (a file-based database), it requires a hosting provider with **Persistent Storage** (Disk). Serverless platforms like Vercel will reset the database on every restart.

**Recommended Platform: Render.com**
1.  Push this code to GitHub.
2.  Create a **New Web Service** on Render.
3.  Connect your repo.
4.  Build Command: `npm install`
5.  Start Command: `node server.js`
6.  **Important**: Add a "Disk" in the Render settings to persist `articles.db`.

### 2. Frontend (React)
**Recommended Platform: Vercel**
1.  Push code to GitHub.
2.  Import the project in Vercel.
3.  Set the **Root Directory** to `frontend`.
4.  The Build Command (`npm run build`) and Output Directory (`dist`) should be detected automatically.
5.  **Environment Variable**: Set `VITE_API_URL` to your deployed Backend URL (from step 1).

---

## 📂 Deployment Config Files
I have added a `vercel.json` file to the root. This is an experimental config for attempting a "Monorepo" deployment on Vercel, but please note the SQLite database will be read-only or reset frequently on serverless architecture.
