const WebSocket = require("ws")

const wss = new WebSocket.Server({ port: 3001 })

console.log("WebSocket server started on port 3001")

// Store connected clients
const clients = new Set()

wss.on("connection", (ws) => {
  console.log("Client connected")
  clients.add(ws)

  ws.on("close", () => {
    console.log("Client disconnected")
    clients.delete(ws)
  })

  ws.on("error", (error) => {
    console.error("WebSocket error:", error)
    clients.delete(ws)
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

// Simulate real-time updates
setInterval(() => {
  if (clients.size > 0) {
    const randomRowId = `row_${Math.floor(Math.random() * 1000)}`
    const randomColumnId = updateableColumns[Math.floor(Math.random() * updateableColumns.length)]
    const randomValue = generateUpdateValue(randomColumnId)

    const message = JSON.stringify({
      type: "update",
      rowId: randomRowId,
      columnId: randomColumnId,
      newValue: randomValue,
    })

    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message)
      }
    })

    console.log(`Sent update: ${randomRowId}.${randomColumnId} = ${randomValue}`)
  }
}, 2000) // Send update every 2 seconds

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("Shutting down WebSocket server...")
  wss.close(() => {
    console.log("WebSocket server closed")
    process.exit(0)
  })
})
