require('dotenv').config()
const WebSocket = require("ws")
const http = require("http")
const { 
  connectToDatabase, 
  initializeData, 
  getAllRows, 
  updateCell, 
  getRecentUpdates,
  closeConnection 
} = require('./db')

const PORT = process.env.PORT || 3001

// Create HTTP server
const server = http.createServer((req, res) => {
  // Health check endpoint for Render
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('WebSocket server is running')
  } else {
    res.writeHead(404)
    res.end('Not found')
  }
})

// Create WebSocket server using the HTTP server
const wss = new WebSocket.Server({ server })

console.log(`Server starting on port ${PORT}`)

// Store connected clients
const clients = new Set()

// Initialize MongoDB connection and data
async function initialize() {
  try {
    await connectToDatabase()
    await initializeData()
    console.log('MongoDB initialized successfully')
  } catch (error) {
    console.error('Failed to initialize MongoDB:', error)
    console.log('WebSocket server will run without MongoDB persistence')
  }
}

initialize()

wss.on("connection", (ws) => {
  console.log("Client connected")
  clients.add(ws)

  // Send initial connection confirmation
  ws.send(JSON.stringify({ type: 'connected', message: 'Connected to WebSocket server' }))

  ws.on("close", () => {
    console.log("Client disconnected")
    clients.delete(ws)
  })

  ws.on("error", (error) => {
    console.error("WebSocket error:", error)
    clients.delete(ws)
  })

  ws.on("message", async (data) => {
    try {
      const message = JSON.parse(data.toString())
      console.log("Received message:", message)
      
      // Handle cell updates from clients
      if (message.type === 'update') {
        const { rowId, columnId, newValue } = message
        
        // Save to MongoDB
        const success = await updateCell(rowId, columnId, newValue)
        
        if (success) {
          // Broadcast update to all connected clients
          const broadcastMessage = JSON.stringify({
            type: 'update',
            rowId,
            columnId,
            newValue,
            timestamp: new Date().toISOString()
          })
          
          clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(broadcastMessage)
            }
          })
          
          console.log(`Update saved and broadcast: ${rowId}.${columnId} = ${newValue}`)
        }
      }
    } catch (error) {
      console.error("Error processing message:", error)
    }
  })
})

// List of updateable columns for real-time updates
const updateableColumns = [
  'revenue', 'expenses', 'profit', 'employees',
  'status', 'verified', 'premium', 'subscription_tier',
  'total_score', 'risk_factor', 'satisfaction_score',
  'engagement_rate', 'conversion_rate'
]

// Add metric columns
for (let i = 1; i <= 20; i++) {
  updateableColumns.push(`performance_metric_${i}`)
  updateableColumns.push(`sales_metric_${i}`)
  updateableColumns.push(`behavior_metric_${i}`)
  updateableColumns.push(`kpi_${i}`)
}

// Function to generate realistic updates based on column type
function generateUpdateValue(columnId) {
  switch (columnId) {
    case 'revenue':
    case 'expenses':
      return Math.floor(Math.random() * 1000000)
    case 'profit':
      return Math.floor(Math.random() * 200000)
    case 'employees':
      return Math.floor(Math.random() * 1000) + 10
    case 'status':
      return Math.random() > 0.5 ? 'Active' : 'Inactive'
    case 'verified':
    case 'premium':
      return Math.random() > 0.5
    case 'subscription_tier':
      return ['Free', 'Basic', 'Pro', 'Enterprise'][Math.floor(Math.random() * 4)]
    case 'total_score':
    case 'risk_factor':
    case 'satisfaction_score':
    case 'engagement_rate':
    case 'conversion_rate':
      return (Math.random() * 100).toFixed(2)
    default:
      // For metric columns
      if (columnId.includes('performance_metric') || columnId.includes('kpi')) {
        return (Math.random() * 100).toFixed(2)
      } else if (columnId.includes('sales_metric') || columnId.includes('behavior_metric')) {
        return Math.floor(Math.random() * 10000)
      }
      return Math.floor(Math.random() * 1000)
  }
}

// Updates now only happen when cells are edited by users
// Row IDs range from row_0 to row_99999 for 100,000 rows

// Start the HTTP server
server.listen(PORT, () => {
  console.log(`HTTP/WebSocket server listening on port ${PORT}`)
  console.log(`Health check available at http://localhost:${PORT}/health`)
  console.log(`WebSocket endpoint: ws://localhost:${PORT}`)
})

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down server...")
  
  // Close all WebSocket connections
  clients.forEach(client => {
    client.close(1000, 'Server shutting down')
  })
  
  wss.close(async () => {
    console.log("WebSocket server closed")
    
    // Close MongoDB connection
    await closeConnection()
    
    server.close(() => {
      console.log("HTTP server closed")
      process.exit(0)
    })
  })
})