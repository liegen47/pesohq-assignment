import { type NextRequest, NextResponse } from "next/server"

interface DataRow {
  id: string
  [key: string]: any
}

// Generate mock data
const generateMockData = (startRow: number, endRow: number, totalColumns: number): DataRow[] => {
  const data: DataRow[] = []
  for (let i = startRow; i < endRow; i++) {
    const row: DataRow = { id: `row_${i}` }
    for (let j = 1; j < totalColumns; j++) {
      const columnName = `column_${j}`
      switch (j % 5) {
        case 0:
          row[columnName] = `Text_${i}_${j}`
          break
        case 1:
          row[columnName] = Math.floor(Math.random() * 10000)
          break
        case 2:
          row[columnName] = (Math.random() * 1000).toFixed(2)
          break
        case 3:
          row[columnName] = Math.random() > 0.5 ? "Active" : "Inactive"
          break
        case 4:
          row[columnName] = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
          break
      }
    }
    data.push(row)
  }
  return data
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const startRow = Number.parseInt(searchParams.get("startRow") || "0")
  const endRow = Number.parseInt(searchParams.get("endRow") || "100")
  const totalColumns = Number.parseInt(searchParams.get("columns") || "120")

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100))

  const data = generateMockData(startRow, endRow, totalColumns)

  return NextResponse.json({
    data,
    totalRows: 100000,
    totalColumns,
  })
}
