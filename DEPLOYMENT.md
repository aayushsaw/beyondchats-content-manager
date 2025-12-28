# BeyondChats Content Manager - Deployment Guide

## Backend Deployment on Render

### Step 1: Prepare Your Repository
1. Make sure all changes are committed and pushed to your GitHub repository
2. The `render.yaml` file is already configured for easy deployment

### Step 2: Deploy to Render
1. Go to [render.com](https://render.com) and sign up/login
2. Click "New" → "Blueprint" (or "Web Service" if Blueprint doesn't work)
3. Connect your GitHub repository: `aayushsaw/beyondchats-content-manager`
4. Configure the service:
   - **Name**: `beyondchats-backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: `Production`

### Step 3: Environment Variables
Set these environment variables in Render:
- `NODE_ENV`: `production`
- `PORT`: `10000` (Render will set this automatically)

### Step 4: Database Setup
For production, you might want to use a persistent database. For now, Render will use the SQLite database, but data won't persist between deployments.

### Step 5: Update Frontend
After deployment, update your frontend's API URL:
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'https://your-render-backend-url.onrender.com/api/articles';
```

## Alternative: Deploy Frontend to Vercel/Netlify

### Vercel Deployment (Recommended for Frontend)
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Set the root directory to `frontend`
4. Add environment variable: `VITE_API_URL=https://your-render-backend-url.onrender.com/api/articles`
5. Deploy!

### Netlify Deployment
1. Go to [netlify.com](https://netlify.com)
2. Drag and drop the `frontend/dist` folder (after running `npm run build`)
3. Set environment variables in site settings
4. Deploy!

## Current Issues & Solutions

### CORS Issues
The backend is configured to allow requests from:
- Development: `http://localhost:5173`
- Production: Your Render domain

### Database Persistence
SQLite works for development but data resets on each deployment. Consider:
- Using Render's PostgreSQL database
- Using a cloud database service (PlanetScale, Supabase, etc.)

### API Connection
Make sure your frontend uses the correct API URL for the deployed backend.