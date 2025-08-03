# PesoHQ Grid - Comprehensive Project Documentation

## Project Overview

PesoHQ Grid is a high-performance data grid application designed to demonstrate the capabilities of handling large datasets with real-time updates. The project showcases modern web development practices using React, Next.js, and AG-Grid to efficiently manage and display 100,000+ rows and 120 columns of data.

## Architecture Overview

### Technology Stack

- **Frontend Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Language**: TypeScript
- **Data Grid**: AG-Grid Community Edition
- **State Management**: TanStack Query (React Query)
- **Real-time Communication**: WebSocket (ws library)
- **Styling**: Tailwind CSS with shadcn/ui components
- **Build Tool**: Next.js built-in webpack configuration

### Project Structure

```
pesohq-grid/
├── app/                    # Next.js App Router directory
│   ├── page.tsx           # Main application page with data grid
│   ├── layout.tsx         # Root layout component
│   ├── globals.css        # Global styles
│   ├── providers/         # React context providers
│   │   └── query-provider.tsx  # TanStack Query provider
│   └── api/               # API routes
│       └── data/
│           └── route.ts   # Data fetching endpoint
├── components/            # Reusable React components
│   ├── connection-status.tsx  # WebSocket connection indicator
│   ├── theme-provider.tsx     # Theme management
│   └── ui/               # shadcn/ui components library
├── scripts/              # Utility scripts
│   └── websocket-server.js   # WebSocket server for real-time updates
├── lib/                  # Utility functions
│   └── utils.ts         # Helper functions
└── public/              # Static assets
```

## How It Works

### 1. Initial Application Load

When the application starts:

1. **Next.js Server**: Serves the React application
2. **React Query Setup**: Initializes data fetching and caching
3. **AG-Grid Initialization**: Sets up the data grid with configuration for:
   - 120 columns
   - Infinite scrolling
   - Cell virtualization
   - Sorting and filtering capabilities

### 2. Data Generation and Loading

The application uses mock data generation for demonstration:

```typescript
// Generates mock data with various data types
- Text fields: `Text_${rowIndex}_${columnIndex}`
- Numbers: Random integers (0-10000)
- Decimals: Random floats with 2 decimal places
- Status: "Active" or "Inactive"
- Dates: Random dates within the past year
```

**Loading Strategy**:
- Initial load: First 100 rows
- Pagination: Loads 100 rows at a time
- Infinite scrolling: Triggered when user scrolls near the bottom
- Maximum capacity: 100,000 rows

### 3. Performance Optimizations

#### Virtualization
- **DOM Virtualization**: Only renders visible cells (viewport)
- **Column Virtualization**: Horizontal scrolling renders only visible columns
- **Row Virtualization**: Vertical scrolling renders only visible rows

#### Memory Management
- **Cache Block Size**: 100 rows per block
- **Max Blocks in Cache**: 10 blocks (1,000 rows maximum in memory)
- **Lazy Loading**: Data loaded on-demand as user scrolls

#### Rendering Optimizations
- **Debounced Updates**: Performance stats update every second
- **React.memo**: Prevents unnecessary re-renders
- **Callback Optimization**: Uses useCallback for event handlers

### 4. Real-time Updates via WebSocket

The WebSocket implementation provides live data updates:

#### Server Side (websocket-server.js)
```javascript
- Runs on port 3001
- Simulates updates every 2 seconds
- Randomly selects cells to update
- Broadcasts updates to all connected clients
```

#### Client Side (page.tsx)
```javascript
- Connects to ws://localhost:3001
- Handles connection/disconnection gracefully
- Automatic reconnection with 5-second delay
- Updates grid cells in real-time
- Highlights updated cells with animation
```

#### Update Flow:
1. WebSocket server generates random update
2. Sends message: `{type: "update", rowId, columnId, newValue}`
3. Client receives message
4. Updates local data state
5. Highlights cell with yellow pulse animation
6. Animation fades after 2 seconds

### 5. Performance Monitoring

The application tracks and displays real-time performance metrics:

- **Rows Loaded**: Total rows fetched from API
- **Columns Loaded**: Visible columns in viewport
- **Cells Rendered**: Actual DOM elements (rows × columns)
- **Memory Rows**: Total rows cached in memory
- **Memory Columns**: Total columns in dataset
- **WebSocket Status**: Connection state
- **Last Update**: Timestamp of most recent real-time update

### 6. User Interface Components

#### Main Grid Component (page.tsx)
- Manages grid state and data
- Handles WebSocket connections
- Tracks performance metrics
- Implements infinite scrolling datasource

#### Connection Status Component
- Visual indicator for WebSocket connection
- Shows instructions when disconnected
- Displays last update timestamp

#### Performance Cards
- Real-time statistics display
- Uses shadcn/ui Card components
- Updates every second via useEffect

### 7. Data Flow Architecture

```
User Interaction
       ↓
AG-Grid Component
       ↓
Infinite Row Model ←→ TanStack Query
       ↓                    ↓
Virtual DOM            Data Cache
       ↓                    ↑
   Browser DOM         Mock Data API
       
WebSocket Server
       ↓
Real-time Updates → Grid State → Cell Highlighting
```

## Key Features Explained

### Infinite Scrolling Implementation
```typescript
const datasource = {
  getRows: (params) => {
    // Fetch data for requested range
    // Update performance stats
    // Return data via callback
  }
}
```

### Cell Highlighting for Updates
```typescript
// Tracks highlighted cells in a Set
// Adds cell key on update
// Removes after 2-second timeout
// Custom cell renderer applies highlight class
```

### Performance Tracking
```typescript
// Uses refs and state for metrics
// Updates via grid events
// Debounced to prevent excessive renders
```

## Running the Application

### Development Mode
1. Install dependencies: `npm install`
2. Start WebSocket server: `npm run ws-server` (separate terminal)
3. Start Next.js dev server: `npm run dev`
4. Open browser: http://localhost:3000

### Production Build
1. Build application: `npm run build`
2. Start production server: `npm start`
3. Run WebSocket server separately for real-time features

## Configuration and Customization

### Grid Configuration
- **Row Height**: Default AG-Grid row height
- **Column Width**: 150px default, 100px for ID column
- **Pinned Columns**: ID column pinned to left
- **Sorting/Filtering**: Enabled on all columns

### WebSocket Configuration
- **Port**: 3001 (hardcoded)
- **Update Interval**: 2 seconds
- **Reconnection Delay**: 5 seconds

### Performance Tuning
- **Cache Block Size**: Adjust in `cacheBlockSize` prop
- **Max Blocks**: Modify `maxBlocksInCache` prop
- **Update Frequency**: Change interval in websocket-server.js

## Limitations and Trade-offs

1. **Mock Data**: Uses generated data instead of real database
2. **Memory Usage**: Keeps loaded data in memory for performance
3. **WebSocket Security**: No authentication/authorization implemented
4. **Browser Limits**: Performance depends on client hardware
5. **Update Frequency**: Limited to prevent UI overwhelm

## Future Enhancements

1. **Backend Integration**: Connect to real database
2. **Authentication**: Secure WebSocket connections
3. **Data Persistence**: Save grid state and preferences
4. **Export Features**: CSV/Excel export functionality
5. **Advanced Filtering**: Custom filter components
6. **Mobile Optimization**: Responsive design for smaller screens

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Ensure WebSocket server is running: `npm run ws-server`
   - Check port 3001 is not in use
   - Verify no firewall blocking

2. **Poor Performance**
   - Reduce cache block size
   - Limit visible columns
   - Check browser dev tools for memory usage

3. **Data Not Loading**
   - Check browser console for errors
   - Verify React Query is properly configured
   - Ensure API route is accessible

## Conclusion

PesoHQ Grid demonstrates modern web application capabilities for handling large datasets with real-time updates. The architecture balances performance, user experience, and development simplicity while showcasing best practices in React and Next.js development.