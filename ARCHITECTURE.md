# PesoHQ Grid - Architecture Document

## Architecture Overview

The PesoHQ Grid application is built with a modern, performance-focused architecture that efficiently handles 100K+ rows and 100+ columns of data with real-time updates.

### Core Architecture Components

1. **Frontend Layer**: Next.js 14 (App Router) + React 18 + TypeScript
   - Server-side rendering for initial page load
   - Client-side data fetching with TanStack Query
   - AG-Grid Community for high-performance data visualization

2. **Data Layer**: MongoDB Atlas + Generated Data
   - MongoDB Atlas for persistent data storage
   - Base data from JSONPlaceholder API (https://jsonplaceholder.typicode.com/users)
   - Data expansion algorithm to generate 100+ columns per row
   - In-memory caching for loaded data chunks

3. **Real-time Layer**: WebSocket Server + MongoDB Sync
   - Node.js WebSocket server on port 3001
   - MongoDB integration for data persistence
   - Broadcasts updates to all connected clients
   - Automatic data synchronization between clients

## Performance Optimization Strategies

### 1. Virtualization (Primary Strategy)
- **DOM Virtualization**: Only renders visible cells in viewport
- **Horizontal Scrolling**: Loads columns on-demand
- **Vertical Scrolling**: Implements infinite scroll pattern
- **Buffer Zone**: Renders extra rows/columns outside viewport for smooth scrolling

### 2. Data Loading Strategy
- **Lazy Loading**: Data fetched in 100-row chunks
- **Infinite Scroll Model**: AG-Grid's built-in infinite row model
- **Cache Management**: Limits memory usage to 10 blocks (1,000 rows max)
- **Async Data Generation**: Non-blocking data expansion

### 3. Rendering Optimizations
- **React.memo**: Prevents unnecessary re-renders
- **useCallback Hooks**: Memoizes event handlers
- **Debounced Updates**: Performance stats update once per second
- **Cell-level Updates**: Only affected cells re-render on WebSocket updates

### 4. Network Optimizations
- **Data Compression**: Minimal data structure for updates
- **WebSocket Protocol**: Lower overhead than HTTP polling
- **Automatic Reconnection**: 5-second retry on connection loss

## Trade-offs Made

### 1. Memory vs Performance
- **Decision**: Keep loaded data in memory for instant access
- **Trade-off**: Higher memory usage for better scroll performance
- **Mitigation**: Limited cache size (10 blocks maximum)

### 2. Real-time Update Frequency
- **Decision**: 2-second update interval
- **Trade-off**: Balance between real-time feel and performance
- **Reasoning**: Prevents UI overwhelming with too frequent updates

### 3. Data Source
- **Decision**: Use mock API with data expansion
- **Trade-off**: Not real production data
- **Benefit**: Consistent performance testing, no API rate limits

### 4. Column Rendering
- **Decision**: Render all columns (no column virtualization)
- **Trade-off**: More memory usage for column definitions
- **Benefit**: Simpler implementation, better filtering/sorting UX

## Key Design Decisions

1. **AG-Grid over Custom Implementation**: Leverages battle-tested grid with built-in virtualization
2. **TanStack Query**: Provides caching, background refetching, and error handling
3. **TypeScript**: Type safety for large codebase maintainability
4. **Next.js App Router**: Modern React patterns with server components support
5. **WebSocket over Polling**: More efficient for real-time updates

## Performance Metrics Tracked

- **Rows Loaded**: Total rows fetched from data source
- **Columns Loaded**: Visible columns in current viewport
- **Cells Rendered**: Actual DOM elements (rows × columns)
- **Memory Usage**: Total rows/columns in cache
- **Connection Status**: WebSocket health monitoring
- **Update Latency**: Time since last real-time update
- **Visible Row Range**: Current viewport row boundaries
- **Virtualization Status**: Active/Inactive indicator

## MongoDB Integration

### Data Structure
```javascript
{
  row_id: "row_0",
  data: {
    id: "row_0",
    name: "User 1",
    revenue: 500000,
    // ... 100+ columns
  },
  updates: [
    {
      columnId: "revenue",
      newValue: 600000,
      timestamp: "2024-01-01T12:00:00Z"
    }
  ],
  created_at: Date,
  updated_at: Date
}
```

### Real-time Sync Flow
1. Client edits a cell
2. Update sent via WebSocket to server
3. Server persists to MongoDB
4. Server broadcasts to all connected clients
5. All clients receive real-time updates

### MongoDB Setup Requirements
- MongoDB Atlas free tier (M0 Sandbox)
- Network access configuration
- Connection string in environment variables
- Automatic index creation for performance