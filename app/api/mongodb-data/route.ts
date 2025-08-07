import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

// MongoDB connection settings
const MONGODB_URI = process.env.MONGODB_URI || ''
const DB_NAME = process.env.DB_NAME || 'pesohq-grid'
const COLLECTION_NAME = process.env.COLLECTION_NAME || 'grid-data'

let client: MongoClient | null = null

async function getMongoClient() {
  if (!client) {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not configured')
    }
    client = new MongoClient(MONGODB_URI)
    await client.connect()
  }
  return client
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const startRow = parseInt(searchParams.get('startRow') || '0')
    const endRow = parseInt(searchParams.get('endRow') || '100')
    const limit = endRow - startRow

    const mongoClient = await getMongoClient()
    const db = mongoClient.db(DB_NAME)
    const collection = db.collection(COLLECTION_NAME)

    // Fetch data from MongoDB
    const rows = await collection
      .find({})
      .skip(startRow)
      .limit(limit)
      .project({ data: 1, _id: 0 })
      .toArray()

    const data = rows.map(row => row.data)

    // Get total count
    const totalCount = await collection.countDocuments()

    return NextResponse.json({
      rows: data,
      lastRow: totalCount
    })
  } catch (error) {
    console.error('MongoDB fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data from MongoDB' },
      { status: 500 }
    )
  }
}

// Clean up on process exit
if (process.env.NODE_ENV !== 'production') {
  process.on('exit', async () => {
    if (client) {
      await client.close()
    }
  })
}