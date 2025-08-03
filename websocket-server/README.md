# PesoHQ WebSocket Server

Real-time WebSocket server for PesoHQ data grid updates.

## Local Development

```bash
npm install
npm start
```

Server runs on port 3001 by default.

## Deployment

This server is configured for deployment on Render.com using the included `render.yaml` file.

## Environment Variables

- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)