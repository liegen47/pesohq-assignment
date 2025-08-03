# Deployment Guide

## Step 1: Deploy WebSocket Server on Render

1. **Push WebSocket server to GitHub:**
   ```bash
   cd websocket-server
   git init
   git add .
   git commit -m "Initial WebSocket server"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Deploy on Render:**
   - Go to [render.com](https://render.com)
   - Sign up/Login with GitHub
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `websocket-server` repository
   - Render will auto-detect the `render.yaml` configuration
   - Click "Create Web Service"
   - Wait for deployment (takes 2-5 minutes)
   - Copy your WebSocket URL: `wss://your-service-name.onrender.com`

## Step 2: Deploy Next.js App on Vercel

1. **Update environment variable:**
   Edit `.env.production`:
   ```
   NEXT_PUBLIC_WS_URL=wss://your-service-name.onrender.com
   ```

2. **Deploy to Vercel:**
   ```bash
   npm install -g vercel
   vercel
   ```

3. **Add environment variable in Vercel:**
   - During deployment or in Vercel dashboard
   - Add: `NEXT_PUBLIC_WS_URL` = `wss://your-service-name.onrender.com`

## Important Notes

- **Render Free Tier:** Services spin down after 15 minutes of inactivity. First request after idle will take ~30 seconds to spin up.
- **WebSocket URL:** Replace `your-service-name` with your actual Render service name
- **CORS:** The WebSocket server accepts all origins by default. For production, consider adding origin validation.

## Testing

1. Visit your Vercel deployment URL
2. Check the WebSocket connection status indicator
3. Real-time updates should work when both services are running

## Troubleshooting

- If WebSocket doesn't connect, check:
  - Render service is deployed and running
  - Environment variable is set correctly in Vercel
  - WebSocket URL uses `wss://` (not `ws://`) for HTTPS sites