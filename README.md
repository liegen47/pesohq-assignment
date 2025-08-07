# PesoHQ - High Performance Data Grid

A high-performance data grid application built with React, Next.js, and AG Grid that efficiently handles large datasets (100+ columns, 100K+ records) with real-time updates and MongoDB persistence.

## Features

- **Large Dataset Support**: Handles 100+ columns and 100K+ records efficiently
- **Virtualization**: Only renders visible cells for optimal performance with visual indicators
- **Real-time Updates**: WebSocket integration with MongoDB sync for live data updates
- **Performance Tracking**: Real-time statistics including visible row range and virtualization status
- **MongoDB Integration**: Persistent data storage with automatic synchronization
- **Multi-Client Support**: Multiple clients stay synchronized through WebSocket and MongoDB
- **2D Pagination**: Horizontal and vertical scrolling with lazy loading
- **Infinite Scrolling**: Loads additional data as user scrolls
- **Data Source**: Uses JSONPlaceholder API as base data, expanded to 100+ columns
- **Filtering & Sorting**: Full column filtering and sorting capabilities

## Tech Stack

- **Frontend**: React 18, Next.js 14 (App Router), TypeScript
- **Data Grid**: AG Grid Community
- **Database**: MongoDB Atlas (free tier)
- **State Management**: TanStack Query (React Query)
- **Styling**: Tailwind CSS, shadcn/ui
- **Real-time**: WebSocket with MongoDB persistence
- **Performance**: Virtualization, Infinite Scrolling

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- MongoDB Atlas account (free tier)

### MongoDB Setup

1. **Create MongoDB Atlas Account**:
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for a free account
   - Create a new cluster (M0 Sandbox - Free tier)

2. **Configure Database Access**:
   - Add a database user with read/write permissions
   - Configure network access (allow from anywhere for development)
   - Get your connection string

3. **Set Environment Variables**:
   
   Create `websocket-server/.env`:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/
   DB_NAME=pesohq-grid
   COLLECTION_NAME=grid-data
   PORT=3001
   ```
   
   Create `.env.local` in root:
   ```env
   NEXT_PUBLIC_WS_URL=ws://localhost:3001
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/
   DB_NAME=pesohq-grid
   COLLECTION_NAME=grid-data
   ```

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pesohq-grid
```

2. Install dependencies:
```bash
npm install
cd websocket-server && npm install
cd ..
```

3. Start the WebSocket server (in a separate terminal):
```bash
cd websocket-server
npm start
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Testing Two Clients

Open `test-two-clients.html` in your browser to see two clients running side by side. Edit cells in one client to see real-time updates in the other.

## Data Source

The application uses the **JSONPlaceholder API** (https://jsonplaceholder.typicode.com/users) as the base data source, which is then expanded programmatically to achieve:
- **100+ Columns**: User data is expanded with financial metrics, performance indicators, and KPIs
- **100K+ Rows**: Base user data is replicated and varied to create a large dataset
- **Real-time Simulation**: WebSocket server generates updates for numeric and status fields

## Architecture

### Data Flow
1. **Initial Load**: Fetches base data from JSONPlaceholder API and expands it
2. **Data Expansion**: Each user record is expanded to 100+ columns with generated metrics
3. **Infinite Scrolling**: AG Grid's infinite row model loads additional data as needed
4. **Virtualization**: Only visible cells are rendered in the DOM
5. **Real-time Updates**: WebSocket server sends random updates every 2 seconds

### Performance Optimizations
1. **Virtualization**: AG Grid handles DOM virtualization automatically
2. **Infinite Row Model**: Loads data in chunks to minimize memory usage
3. **Caching**: React Query caches API responses
4. **Debounced Updates**: Performance stats update every second to avoid excessive re-renders

### Components Structure
- \`app/page.tsx\` - Main grid component with performance tracking
- \`app/api/data/route.ts\` - API endpoint for data fetching
- \`scripts/websocket-server.js\` - WebSocket server for real-time updates
- \`app/providers/query-provider.tsx\` - React Query setup

## Performance Features

The application tracks and displays:
- Total rows loaded in memory
- Total columns loaded
- Number of cells currently rendered
- WebSocket connection status
- Last update timestamp
- **Visible row range indicator** - Shows which rows are currently in viewport
- **Virtualization status** - Visual indicator showing when virtualization is active
- **Scroll position tracking** - Real-time updates as you scroll through data

## Real-time Updates

The WebSocket server simulates real-time updates by:
1. Sending random cell updates every 2 seconds
2. Highlighting updated cells with animation
3. Maintaining connection with automatic reconnection

## Trade-offs

1. **Memory vs Performance**: Keeps loaded data in memory for fast access
2. **Update Frequency**: Limited to prevent overwhelming the UI
3. **Mock Data**: Uses generated data instead of real API for demonstration
4. **WebSocket Simplicity**: Basic implementation without authentication/authorization

## Development

### Running Tests
\`\`\`bash
npm run test
\`\`\`

### Building for Production
\`\`\`bash
npm run build
npm start
\`\`\`

## License

MIT License
