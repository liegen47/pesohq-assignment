require('dotenv').config()
const { MongoClient } = require('mongodb')

// MongoDB connection from environment variables
const MONGODB_URI = process.env.MONGODB_URI
const DB_NAME = process.env.DB_NAME || 'pesohq-grid'
const COLLECTION_NAME = process.env.COLLECTION_NAME || 'grid-data'

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set in environment variables')
  console.log('Please set MONGODB_URI in your .env file')
  console.log('Example: MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/')
}

let client = null
let db = null
let collection = null

async function connectToDatabase() {
  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not configured')
    }

    if (!client) {
      console.log('Connecting to MongoDB...')
      client = new MongoClient(MONGODB_URI)
      
      await client.connect()
      console.log('Connected to MongoDB successfully')
      
      db = client.db(DB_NAME)
      collection = db.collection(COLLECTION_NAME)
      
      // Create indexes for better performance
      await collection.createIndex({ row_id: 1 })
      await collection.createIndex({ 'updates.timestamp': -1 })
    }
    
    return { db, collection }
  } catch (error) {
    console.error('MongoDB connection error:', error)
    throw error
  }
}

async function initializeData() {
  try {
    const { collection } = await connectToDatabase()
    
    // Check if data already exists
    const count = await collection.countDocuments()
    if (count > 0) {
      console.log(`Database already contains ${count} documents`)
      return
    }
    
    console.log('Initializing database with sample data...')
    
    // Create initial dataset (100,000 rows)
    const TOTAL_ROWS = 100000
    const BATCH_SIZE = 1000
    
    console.log(`Creating ${TOTAL_ROWS.toLocaleString()} rows...`)
    
    // Insert in batches to avoid memory issues
    for (let batchStart = 0; batchStart < TOTAL_ROWS; batchStart += BATCH_SIZE) {
      const documents = []
      const batchEnd = Math.min(batchStart + BATCH_SIZE, TOTAL_ROWS)
      
      for (let i = batchStart; i < batchEnd; i++) {
        // Generate more realistic names
        const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emma', 'Robert', 'Lisa', 'James', 'Mary', 
                           'William', 'Patricia', 'Richard', 'Jennifer', 'Charles', 'Linda', 'Joseph', 'Barbara', 
                           'Thomas', 'Susan', 'Christopher', 'Jessica', 'Daniel', 'Helen', 'Paul', 'Anna', 'Mark', 
                           'Margaret', 'Donald', 'Dorothy', 'George', 'Ruth', 'Kenneth', 'Sharon', 'Steven', 'Michelle'];
        const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 
                          'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 
                          'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 
                          'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen'];
        
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const fullName = `${firstName} ${lastName}`;
        const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 100)}`;
        const userId = `USR${String(i + 1).padStart(6, '0')}`;
        
      // Generate row data with all columns
      const rowData = {
        id: `row_${i}`,
        row_number: i,
        user_id: userId,
        name: fullName,
        username: username,
        email: `${username}@example.com`,
        phone: `555-${Math.floor(Math.random() * 9000) + 1000}`,
        website: `${username.split('.')[0]}.com`,
        
        // Address fields
        address_street: `${Math.floor(Math.random() * 999) + 1} ${['Main', 'Oak', 'Elm', 'Pine', 'Maple'][Math.floor(Math.random() * 5)]} St`,
        address_suite: `Suite ${Math.floor(Math.random() * 999) + 1}`,
        address_city: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'][Math.floor(Math.random() * 5)],
        address_zipcode: String(10000 + Math.floor(Math.random() * 89999)),
        address_lat: 40 + Math.random() * 10,
        address_lng: -74 + Math.random() * 10,
        
        // Company fields
        company_name: `${lastName} Industries`,
        company_catchphrase: 'Innovative solutions for tomorrow',
        company_bs: 'synergize scalable networks',
        
        // Financial data
        revenue: Math.floor(Math.random() * 1000000),
        expenses: Math.floor(Math.random() * 800000),
        profit: Math.floor(Math.random() * 200000),
        employees: Math.floor(Math.random() * 1000) + 10,
        
        // Dates
        created_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        last_login: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        next_review: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        
        // Status fields
        status: Math.random() > 0.5 ? 'Active' : 'Inactive',
        verified: Math.random() > 0.3,
        premium: Math.random() > 0.7,
        subscription_tier: ['Free', 'Basic', 'Pro', 'Enterprise'][Math.floor(Math.random() * 4)],
        
        // Metadata
        batch_id: Math.floor(i / 100),
        segment: `Segment_${Math.floor(i / 1000)}`,
        cohort: `Cohort_${Math.floor(i / 5000)}`,
        random_value: Math.random(),
        timestamp: new Date().toISOString(),
      };
      
      // Add performance metrics (20 columns)
      for (let j = 1; j <= 20; j++) {
        rowData[`performance_metric_${j}`] = (Math.random() * 100).toFixed(2);
      }
      
      // Add sales metrics (20 columns)
      for (let j = 1; j <= 20; j++) {
        rowData[`sales_metric_${j}`] = Math.floor(Math.random() * 10000);
      }
      
      // Add behavior metrics (20 columns)
      for (let j = 1; j <= 20; j++) {
        rowData[`behavior_metric_${j}`] = Math.floor(Math.random() * 1000);
      }
      
      // Add KPIs (20 columns)
      for (let j = 1; j <= 20; j++) {
        rowData[`kpi_${j}`] = (Math.random() * 1000).toFixed(3);
      }
      
      // Add calculated fields
      rowData.total_score = (Math.random() * 1000).toFixed(2);
      rowData.risk_factor = (Math.random() * 10).toFixed(2);
      rowData.satisfaction_score = (Math.random() * 5).toFixed(2);
      rowData.engagement_rate = (Math.random() * 100).toFixed(2);
      rowData.conversion_rate = (Math.random() * 100).toFixed(2);
      
      documents.push({
        row_id: `row_${i}`,
        data: rowData,
        updates: [],
        created_at: new Date(),
        updated_at: new Date()
      })
      }
      
      await collection.insertMany(documents)
      console.log(`Inserted batch: ${batchStart + 1} - ${batchEnd} (${documents.length} rows)`)
    }
    
    console.log(`Successfully initialized database with ${TOTAL_ROWS.toLocaleString()} rows`)
  } catch (error) {
    console.error('Error initializing data:', error)
    throw error
  }
}

async function getAllRows(startRow = 0, endRow = 100) {
  try {
    const { collection } = await connectToDatabase()
    
    const rows = await collection
      .find({})
      .skip(startRow)
      .limit(endRow - startRow)
      .project({ data: 1, _id: 0 })
      .toArray()
    
    return rows.map(row => row.data)
  } catch (error) {
    console.error('Error fetching rows:', error)
    throw error
  }
}

async function updateCell(rowId, columnId, newValue) {
  try {
    const { collection } = await connectToDatabase()
    
    const update = {
      $set: {
        [`data.${columnId}`]: newValue,
        updated_at: new Date()
      },
      $push: {
        updates: {
          columnId,
          newValue,
          timestamp: new Date()
        }
      }
    }
    
    const result = await collection.updateOne(
      { row_id: rowId },
      update
    )
    
    return result.modifiedCount > 0
  } catch (error) {
    console.error('Error updating cell:', error)
    throw error
  }
}

async function getRecentUpdates(limit = 10) {
  try {
    const { collection } = await connectToDatabase()
    
    const rows = await collection
      .find({ 'updates.0': { $exists: true } })
      .sort({ 'updates.timestamp': -1 })
      .limit(limit)
      .project({ row_id: 1, updates: { $slice: -1 }, _id: 0 })
      .toArray()
    
    return rows.map(row => ({
      rowId: row.row_id,
      ...row.updates[0]
    }))
  } catch (error) {
    console.error('Error fetching recent updates:', error)
    throw error
  }
}

async function closeConnection() {
  if (client) {
    await client.close()
    client = null
    db = null
    collection = null
    console.log('MongoDB connection closed')
  }
}

module.exports = {
  connectToDatabase,
  initializeData,
  getAllRows,
  updateCell,
  getRecentUpdates,
  closeConnection
}