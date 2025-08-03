# PesoHQ - High Performance Data Grid

A high-performance data grid application built with React, Next.js, and AG Grid that efficiently handles large datasets (100+ columns, 100K+ records) with real-time updates.

## Features

- **Large Dataset Support**: Handles 100+ columns and 100K+ records efficiently
- **Virtualization**: Only renders visible cells for optimal performance
- **Real-time Updates**: WebSocket integration for live data updates with cell highlighting
- **Performance Tracking**: Real-time statistics on rendered components and memory usage
- **2D Pagination**: Horizontal and vertical scrolling with lazy loading
- **Infinite Scrolling**: Loads additional data as user scrolls
- **Data Source**: Uses JSONPlaceholder API as base data, expanded to 100+ columns
- **Filtering & Sorting**: Full column filtering and sorting capabilities

## Tech Stack

- **Frontend**: React 18, Next.js 14 (App Router), TypeScript
- **Data Grid**: AG Grid Community
- **State Management**: TanStack Query (React Query)
- **Styling**: Tailwind CSS, shadcn/ui
- **Real-time**: WebSocket
- **Performance**: Virtualization, Infinite Scrolling

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd pesohq-data-grid
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Start the WebSocket server (in a separate terminal):
\`\`\`bash
npm run ws-server
\`\`\`

4. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

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
