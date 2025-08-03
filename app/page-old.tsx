"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { AgGridReact } from "ag-grid-react"
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community"
import type { ColDef, GridReadyEvent } from "ag-grid-community"
import "ag-grid-community/styles/ag-grid.css"
import "ag-grid-community/styles/ag-theme-quartz.css"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { ConnectionStatus } from "@/components/connection-status"
import { generateLargeDataset, generateColumnDefinitions, type DataRow } from "@/lib/data-generator"

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule])

interface PerformanceStats {
  columnsLoaded: number
  rowsLoaded: number
  cellsRendered: number
  totalMemoryRows: number
  totalMemoryColumns: number
  wsConnected: boolean
  lastUpdate: string | null
}


interface WSMessage {
  type: "update"
  rowId: string
  columnId: string
  newValue: any
}


const TOTAL_ROWS = 100000
const TOTAL_COLUMNS = 120
const PAGE_SIZE = 100
const FILTER_PAGE_SIZE = 1000 // Larger page size when filtering

export default function DataGridApp() {
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats>({
    columnsLoaded: 0,
    rowsLoaded: 0,
    cellsRendered: 0,
    totalMemoryRows: 0,
    totalMemoryColumns: TOTAL_COLUMNS,
    wsConnected: false,
    lastUpdate: null,
  })

  const [loadedRows, setLoadedRows] = useState<DataRow[]>([])
  const [columns] = useState<ColDef[]>(() => generateColumnDefinitions())
  const [editedCellsCount, setEditedCellsCount] = useState(0)
  const [isFiltering, setIsFiltering] = useState(false)
  const [allData, setAllData] = useState<DataRow[]>([])
  const [isLoadingAllData, setIsLoadingAllData] = useState(false)
  const [useClientSideModel, setUseClientSideModel] = useState(false)

  const gridRef = useRef<AgGridReact>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const queryClient = useQueryClient()

  // Initialize WebSocket connection
  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout

    const connectWebSocket = () => {
      // Only attempt WebSocket connection if we're in the browser
      if (typeof window === "undefined") return

      try {
        // Check if WebSocket is supported
        if (!window.WebSocket) {
          console.warn("WebSocket is not supported in this browser")
          return
        }

        wsRef.current = new WebSocket("ws://localhost:3001")

        wsRef.current.onopen = () => {
          setPerformanceStats((prev) => ({ ...prev, wsConnected: true }))
          console.log("WebSocket connected successfully")
          // Clear any existing reconnect timeout
          if (reconnectTimeout) {
            clearTimeout(reconnectTimeout)
          }
        }

        wsRef.current.onmessage = (event) => {
          try {
            const message: WSMessage = JSON.parse(event.data)
            if (message.type === "update") {
              handleRealTimeUpdate(message)
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error)
          }
        }

        wsRef.current.onclose = (event) => {
          setPerformanceStats((prev) => ({ ...prev, wsConnected: false }))
          console.log("WebSocket disconnected:", event.code, event.reason)

          // Only attempt to reconnect if it wasn't a manual close
          if (event.code !== 1000) {
            console.log("Attempting to reconnect in 5 seconds...")
            reconnectTimeout = setTimeout(connectWebSocket, 5000)
          }
        }

        wsRef.current.onerror = (error) => {
          console.warn("WebSocket connection failed. This is expected if the WebSocket server is not running.")
          console.log("To enable real-time updates, run: npm run ws-server")
          setPerformanceStats((prev) => ({ ...prev, wsConnected: false }))
        }
      } catch (error) {
        console.warn("Failed to initialize WebSocket connection:", error)
        console.log("Real-time updates will be disabled. To enable them, run: npm run ws-server")
        setPerformanceStats((prev) => ({ ...prev, wsConnected: false }))
      }
    }

    // Attempt initial connection
    connectWebSocket()

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
      if (wsRef.current) {
        wsRef.current.close(1000, "Component unmounting")
      }
    }
  }, [])

  const handleRealTimeUpdate = useCallback((message: WSMessage) => {
    const { rowId, columnId, newValue } = message

    // Update the data
    setLoadedRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, [columnId]: newValue } : row)))
    
    // Also update allData if it's loaded
    if (allData.length > 0) {
      setAllData((prev) => prev.map((row) => (row.id === rowId ? { ...row, [columnId]: newValue } : row)))
    }

    setPerformanceStats((prev) => ({
      ...prev,
      lastUpdate: new Date().toLocaleTimeString(),
    }))
  }, [allData.length])

  // Load data for filtering (limited dataset for demo)
  const loadDataForFiltering = useCallback(async () => {
    setIsLoadingAllData(true)
    try {
      // Load 5000 rows for filtering demo (full 100K would be too heavy for browser)
      const FILTER_DATASET_SIZE = 5000
      const data = await generateLargeDataset(0, FILTER_DATASET_SIZE, columns)
      setAllData(data)
      setUseClientSideModel(true)
      
      // Update grid with new data
      if (gridRef.current?.api) {
        gridRef.current.api.setGridOption('rowData', data)
      }
      
      setPerformanceStats((prev) => ({
        ...prev,
        rowsLoaded: data.length,
        totalMemoryRows: data.length,
      }))
    } catch (error) {
      console.error('Error loading data for filtering:', error)
    } finally {
      setIsLoadingAllData(false)
    }
  }, [columns])

  // Load initial data
  const { data: initialData, isLoading } = useQuery({
    queryKey: ["gridData", 0, PAGE_SIZE],
    queryFn: async () => {
      const data = await generateLargeDataset(0, PAGE_SIZE, columns)
      setLoadedRows(data)
      setPerformanceStats((prev) => ({
        ...prev,
        rowsLoaded: data.length,
        totalMemoryRows: data.length,
        columnsLoaded: columns.length,
      }))
      return data
    },
  })

  const onGridReady = useCallback(
    (params: GridReadyEvent) => {
      // Only set up infinite scrolling if not using client-side model
      if (!useClientSideModel) {
        const datasource = {
          getRows: async (params: any) => {
            const { startRow, endRow } = params

            try {
              const newData = await generateLargeDataset(startRow, endRow, columns)

              setLoadedRows((prev) => {
                const updated = [...prev, ...newData]
                setPerformanceStats((prevStats) => ({
                  ...prevStats,
                  rowsLoaded: updated.length,
                  totalMemoryRows: updated.length,
                }))
                return updated
              })

              params.successCallback(newData, TOTAL_ROWS)
            } catch (error) {
              console.error('Error loading data:', error)
              params.failCallback()
            }
          },
        }

        params.api.setGridOption('datasource', datasource)
      }
    },
    [columns, useClientSideModel],
  )

  // Track rendered cells
  const onFirstDataRendered = useCallback(() => {
    const updateStats = () => {
      if (gridRef.current?.api) {
        const renderedRowCount = gridRef.current.api.getDisplayedRowCount()
        const visibleColumns = gridRef.current.api.getAllDisplayedColumns()?.length || 0
        const cellsRendered = renderedRowCount * visibleColumns

        setPerformanceStats((prev) => ({
          ...prev,
          cellsRendered,
          columnsLoaded: visibleColumns,
        }))
      }
    }

    updateStats()
    const interval = setInterval(updateStats, 1000)
    return () => clearInterval(interval)
  }, [])

  // Handle cell value changes
  const onCellValueChanged = useCallback((params: any) => {
    const { data, colDef, oldValue, newValue } = params
    
    // Increment edit counter
    setEditedCellsCount(prev => prev + 1)
    
    // Send to WebSocket if connected
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'update',
        rowId: data.id,
        columnId: colDef.field,
        newValue
      }))
    }
    
    console.log('Cell edited:', colDef.field, 'from', oldValue, 'to', newValue)
  }, [])

  // Use columns as-is for better performance
  const columnsWithRenderer = columns

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading grid data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50">
      <div className="max-w-[1920px] mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">PesoHQ - High Performance Data Grid</h1>
          <p className="text-gray-600 mt-1">{TOTAL_ROWS.toLocaleString()} rows × {TOTAL_COLUMNS} columns</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={performanceStats.wsConnected ? "default" : "secondary"}>
            WebSocket: {performanceStats.wsConnected ? "Connected" : "Disconnected"}
          </Badge>
          {!performanceStats.wsConnected && (
            <span className="text-xs text-muted-foreground">Run `npm run ws-server` for real-time updates</span>
          )}
        </div>
      </div>

      {/* Performance Stats */}
      <div className="space-y-4">
        <ConnectionStatus isConnected={performanceStats.wsConnected} lastUpdate={performanceStats.lastUpdate} />
        
        {isFiltering && !useClientSideModel && (
          <Card className="border-yellow-500 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Filtering is currently limited to loaded data only.
                </p>
                <button
                  onClick={loadDataForFiltering}
                  disabled={isLoadingAllData}
                  className="ml-4 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
                >
                  {isLoadingAllData ? 'Loading...' : 'Enable Full Filtering (5K rows)'}
                </button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {useClientSideModel && (
          <Card className="border-green-500 bg-green-50">
            <CardContent className="p-4">
              <p className="text-sm text-green-800">
                <strong>Full Filtering Enabled:</strong> Filtering across {allData.length.toLocaleString()} rows. 
                Note: Infinite scroll is disabled in this mode.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card className="bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600">Rows Loaded</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performanceStats.rowsLoaded.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600">Columns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performanceStats.columnsLoaded}</div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600">Cells Rendered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performanceStats.cellsRendered.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600">In Memory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performanceStats.totalMemoryRows.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600">Cells Edited</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{editedCellsCount}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Data Grid */}
      <Card className="shadow-lg bg-white">
        <CardContent className="p-0">
          <div className="ag-theme-quartz h-[700px]">
            <AgGridReact
              ref={gridRef}
              columnDefs={columnsWithRenderer}
              rowData={useClientSideModel ? allData : undefined}
              rowModelType={useClientSideModel ? "clientSide" : "infinite"}
              cacheBlockSize={PAGE_SIZE}
              maxBlocksInCache={10}
              infiniteInitialRowCount={PAGE_SIZE}
              maxConcurrentDatasourceRequests={2}
              onGridReady={onGridReady}
              onFirstDataRendered={onFirstDataRendered}
              onCellValueChanged={onCellValueChanged}
              onFilterChanged={(event) => {
                const filterModel = event.api.getFilterModel()
                console.log('Filter changed:', filterModel)
                setIsFiltering(Object.keys(filterModel).length > 0)
              }}
              suppressRowClickSelection={true}
              enableRangeSelection={true}
              suppressMenuHide={true}
              defaultColDef={{
                sortable: true,
                filter: true,
                resizable: true,
                floatingFilter: true,
                editable: true,
              }}
              animateRows={false}
              pagination={false}
              loading={isLoadingAllData}
              overlayLoadingTemplate={
                '<span class="ag-overlay-loading-center">Loading data for filtering...</span>'
              }
              suppressCellFocus={true}
              suppressRowHoverHighlight={false}
              rowBuffer={10}
              debounceVerticalScrollbar={true}
            />
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
