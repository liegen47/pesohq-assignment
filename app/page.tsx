"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import type { ColDef, GridReadyEvent } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Wifi,
  RefreshCw,
  Zap,
  Activity,
  FileText,
  FileSpreadsheet,
} from "lucide-react";
import {
  generateLargeDataset,
  generateColumnDefinitions,
  type DataRow,
} from "@/lib/data-generator";
import { exportToCSV, exportToExcel } from "@/lib/export-utils";
import { toast } from "sonner";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

interface PerformanceStats {
  columnsLoaded: number;
  rowsLoaded: number;
  cellsRendered: number;
  totalMemoryRows: number;
  totalMemoryColumns: number;
  wsConnected: boolean;
  lastUpdate: string | null;
}

interface WSMessage {
  type: "update";
  rowId: string;
  columnId: string;
  newValue: any;
}

const TOTAL_ROWS = 100000;
const TOTAL_COLUMNS = 120;
const PAGE_SIZE = 100;

export default function DataGridApp() {
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats>({
    columnsLoaded: 0,
    rowsLoaded: 0,
    cellsRendered: 0,
    totalMemoryRows: 0,
    totalMemoryColumns: TOTAL_COLUMNS,
    wsConnected: false,
    lastUpdate: null,
  });

  const [loadedRows, setLoadedRows] = useState<DataRow[]>([]);
  const [columns] = useState<ColDef[]>(() => generateColumnDefinitions());
  const [editedCellsCount, setEditedCellsCount] = useState(0);
  const [isFiltering, setIsFiltering] = useState(false);
  const [allData, setAllData] = useState<DataRow[]>([]);
  const [isLoadingAllData, setIsLoadingAllData] = useState(false);
  const [useClientSideModel, setUseClientSideModel] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [exportDialog, setExportDialog] = useState<{
    open: boolean;
    format: "csv" | "excel" | null;
  }>({ open: false, format: null });
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({
    current: 0,
    total: 0,
  });

  const gridRef = useRef<AgGridReact>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const wsServerUrl = process.env.NEXT_PUBLIC_WEBSOCKET_SERVER_URL;

  const handleRealTimeUpdate = useCallback(
    (message: WSMessage) => {
      const { rowId, columnId, newValue } = message;

      // Update the data
      setLoadedRows((prev) =>
        prev.map((row) =>
          row.id === rowId ? { ...row, [columnId]: newValue } : row
        )
      );

      // Also update allData if it's loaded
      if (allData.length > 0) {
        setAllData((prev) =>
          prev.map((row) =>
            row.id === rowId ? { ...row, [columnId]: newValue } : row
          )
        );
      }

      setPerformanceStats((prev) => ({
        ...prev,
        lastUpdate: new Date().toLocaleTimeString(),
      }));
    },
    [allData.length]
  );

  // Update current time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout;

    const connectWebSocket = () => {
      // Only attempt WebSocket connection if we're in the browser
      if (typeof window === "undefined") return;

      try {
        // Check if WebSocket is supported
        if (!window.WebSocket) {
          console.warn("WebSocket is not supported in this browser");
          return;
        }

        if (!wsServerUrl) {
          console.warn("WebSocket server URL not configured");
          return;
        }

        const ws = new WebSocket(wsServerUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setPerformanceStats((prev) => ({ ...prev, wsConnected: true }));
          console.log("WebSocket connected successfully");
          clearTimeout(reconnectTimeout);
        };

        ws.onmessage = (event) => {
          try {
            const message: WSMessage = JSON.parse(event.data);
            if (message.type === "update") {
              handleRealTimeUpdate(message);
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };

        ws.onclose = (event) => {
          setPerformanceStats((prev) => ({ ...prev, wsConnected: false }));
          console.log("WebSocket disconnected:", event.code, event.reason);

          if (event.code !== 1000) {
            console.log("Attempting to reconnect in 5 seconds...");
            reconnectTimeout = setTimeout(connectWebSocket, 5000);
          }
        };

        ws.onerror = () => {
          console.warn("WebSocket connection failed");
          console.log("To enable real-time updates, run: npm run ws-server");
          setPerformanceStats((prev) => ({ ...prev, wsConnected: false }));
        };
      } catch (error) {
        console.warn("Failed to initialize WebSocket connection:", error);
        console.log(
          "Real-time updates will be disabled. To enable them, run: npm run ws-server"
        );
        setPerformanceStats((prev) => ({ ...prev, wsConnected: false }));
      }
    };

    connectWebSocket();

    return () => {
      clearTimeout(reconnectTimeout);
      wsRef.current?.close(1000, "Component unmounting");
    };
  }, [wsServerUrl, handleRealTimeUpdate]);

  // Load data for filtering (limited dataset for demo)
  const loadDataForFiltering = useCallback(async () => {
    setIsLoadingAllData(true);
    try {
      // Load 5000 rows for filtering demo (full 100K would be too heavy for browser)
      const FILTER_DATASET_SIZE = 5000;
      const data = await generateLargeDataset(0, FILTER_DATASET_SIZE, columns);
      setAllData(data);
      setUseClientSideModel(true);

      // Update grid with new data
      if (gridRef.current?.api) {
        gridRef.current.api.setGridOption("rowData", data);
      }

      setPerformanceStats((prev) => ({
        ...prev,
        rowsLoaded: data.length,
        totalMemoryRows: data.length,
      }));
    } catch (error) {
      console.error("Error loading data for filtering:", error);
    } finally {
      setIsLoadingAllData(false);
    }
  }, [columns]);

  // Load initial data
  const { data: initialData, isLoading } = useQuery({
    queryKey: ["gridData", 0, PAGE_SIZE],
    queryFn: async () => {
      const data = await generateLargeDataset(0, PAGE_SIZE, columns);
      setLoadedRows(data);
      setPerformanceStats((prev) => ({
        ...prev,
        rowsLoaded: data.length,
        totalMemoryRows: data.length,
        columnsLoaded: columns.length,
      }));
      return data;
    },
  });

  const onGridReady = useCallback(
    (params: GridReadyEvent) => {
      // Only set up infinite scrolling if not using client-side model
      if (!useClientSideModel) {
        const datasource = {
          getRows: async (params: any) => {
            const { startRow, endRow } = params;

            try {
              const newData = await generateLargeDataset(
                startRow,
                endRow,
                columns
              );

              setLoadedRows((prev) => {
                const updated = [...prev, ...newData];
                setPerformanceStats((prevStats) => ({
                  ...prevStats,
                  rowsLoaded: updated.length,
                  totalMemoryRows: updated.length,
                }));
                return updated;
              });

              params.successCallback(newData, TOTAL_ROWS);
            } catch (error) {
              console.error("Error loading data:", error);
              params.failCallback();
            }
          },
        };

        params.api.setGridOption("datasource", datasource);
      }
    },
    [columns, useClientSideModel]
  );

  // Track rendered cells
  const onFirstDataRendered = useCallback(() => {
    const updateStats = () => {
      if (gridRef.current?.api) {
        const renderedRowCount = gridRef.current.api.getDisplayedRowCount();
        const visibleColumns =
          gridRef.current.api.getAllDisplayedColumns()?.length || 0;
        const cellsRendered = renderedRowCount * visibleColumns;

        setPerformanceStats((prev) => ({
          ...prev,
          cellsRendered,
          columnsLoaded: visibleColumns,
        }));
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle cell value changes
  const onCellValueChanged = useCallback((params: any) => {
    const { data, colDef, oldValue, newValue } = params;

    // Increment edit counter
    setEditedCellsCount((prev) => prev + 1);

    // Send to WebSocket if connected
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "update",
          rowId: data.id,
          columnId: colDef.field,
          newValue,
        })
      );
    }

    console.log("Cell edited:", colDef.field, "from", oldValue, "to", newValue);
  }, []);

  // Open export dialog
  const openExportDialog = useCallback((format: "csv" | "excel") => {
    setExportDialog({ open: true, format });
  }, []);

  // Export handlers
  const handleExport = useCallback(
    async (exportAll: boolean = false) => {
      try {
        const format = exportDialog.format;
        if (!format) return;

        setIsExporting(true);

        // Get all data from grid including any edits
        if (gridRef.current?.api) {
          const rowData: DataRow[] = [];

          if (exportAll) {
            // Export all data - need to load it first
            try {
              // Export all 100,000 rows in batches
              const batchSize = 5000;
              let allDataForExport: DataRow[] = [];
              setExportProgress({ current: 0, total: TOTAL_ROWS });

              for (let i = 0; i < TOTAL_ROWS; i += batchSize) {
                const endRow = Math.min(i + batchSize, TOTAL_ROWS);
                const batchData = await generateLargeDataset(
                  i,
                  endRow,
                  columns
                );
                allDataForExport = [...allDataForExport, ...batchData];

                // Update progress
                setExportProgress({ current: endRow, total: TOTAL_ROWS });

                // Small delay to ensure UI updates and prevent browser freeze
                await new Promise((resolve) => setTimeout(resolve, 50));
              }

              if (format === "csv") {
                exportToCSV(allDataForExport, {
                  filename: `pesohq_all_data_${
                    new Date().toISOString().split("T")[0]
                  }`,
                });
                toast(
                  `Exported ${allDataForExport.length.toLocaleString()} rows as CSV`
                );
              } else {
                exportToExcel(allDataForExport, {
                  filename: `pesohq_all_data_${
                    new Date().toISOString().split("T")[0]
                  }`,
                });
                toast(
                  `Exported ${allDataForExport.length.toLocaleString()} rows as Excel`
                );
              }
            } catch (error) {
              toast("Failed to export all data");
            }
          } else {
            // Export only loaded data
            if (useClientSideModel) {
              gridRef.current.api.forEachNode((node) => {
                if (node.data) {
                  rowData.push(node.data);
                }
              });
            } else {
              // For infinite scroll model, use the loaded rows
              rowData.push(...loadedRows);
            }

            if (rowData.length === 0) {
              toast("No data to export");
              setIsExporting(false);
              return;
            }

            // Add small delay to show loader for loaded data too
            await new Promise((resolve) => setTimeout(resolve, 500));

            if (format === "csv") {
              exportToCSV(rowData, {
                filename: `pesohq_loaded_data_${
                  new Date().toISOString().split("T")[0]
                }`,
              });
              toast(
                `Exported ${rowData.length.toLocaleString()} loaded rows as CSV`
              );
            } else {
              exportToExcel(rowData, {
                filename: `pesohq_loaded_data_${
                  new Date().toISOString().split("T")[0]
                }`,
              });
              toast(
                `Exported ${rowData.length.toLocaleString()} loaded rows as Excel`
              );
            }
          }
        }
        setIsExporting(false);
        setExportProgress({ current: 0, total: 0 });
        setExportDialog({ open: false, format: null });
      } catch (error) {
        console.error("Export error:", error);
        toast("Export failed");
        setIsExporting(false);
        setExportProgress({ current: 0, total: 0 });
      }
    },
    [loadedRows, useClientSideModel, exportDialog.format, columns]
  );

  const handleRefresh = useCallback(() => {
    if (gridRef.current?.api) {
      gridRef.current.api.refreshCells({ force: true });
      gridRef.current.api.redrawRows();
      toast("Data refreshed", {
        position: "bottom-right",
        duration: 2000,
      });
    }
  }, []);

  // Use columns as-is for better performance
  const columnsWithRenderer = columns;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-600" />
          <p className="text-gray-600">Loading grid data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 max-w-[1920px] mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-gray-800" />
              <span className="text-sm font-medium text-gray-800">
                High Performance Data Grid
              </span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900">PesoHQ</h1>
            <p className="text-lg text-gray-600">
              {TOTAL_ROWS.toLocaleString()} rows × {TOTAL_COLUMNS} columns
            </p>
          </div>

          {/* Connection Status */}
          <div className="flex items-center space-x-4 mt-2">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Wifi
                  className={`w-5 h-5 ${
                    performanceStats.wsConnected
                      ? "text-gray-700"
                      : "text-gray-400"
                  }`}
                />
                {performanceStats.wsConnected && (
                  <>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></div>
                  </>
                )}
              </div>
              <span className="text-sm text-gray-700">
                WebSocket{" "}
                {performanceStats.wsConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-700">
                Live: {currentTime.toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="space-y-4">
          {isFiltering && !useClientSideModel && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Filtering is currently limited to
                    loaded data only.
                  </p>
                  <Button
                    onClick={loadDataForFiltering}
                    disabled={isLoadingAllData}
                    variant="outline"
                    className="ml-4"
                  >
                    {isLoadingAllData ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Enable Full Filtering (5K rows)"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {useClientSideModel && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <p className="text-sm text-green-800">
                  <strong>Full Filtering Enabled:</strong> Filtering across{" "}
                  {allData.length.toLocaleString()} rows. Note: Infinite scroll
                  is disabled in this mode.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Statistics Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Card className="bg-white border border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600">
                  Rows Loaded
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-gray-900">
                  {performanceStats.rowsLoaded.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600">Columns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-gray-900">
                  {performanceStats.columnsLoaded}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600">
                  Cells Rendered
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-gray-900">
                  {performanceStats.cellsRendered.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600">
                  In Memory
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-gray-900">
                  {performanceStats.totalMemoryRows.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600">
                  Cells Edited
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-gray-900">
                  {editedCellsCount}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Data Grid */}
        <Card className="bg-white border border-gray-200">
          <CardHeader className="border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Data Table
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openExportDialog("csv")}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openExportDialog("excel")}
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Export Excel
                </Button>
                <Button size="sm" onClick={handleRefresh} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="ag-theme-quartz h-[700px] rounded-b-lg overflow-hidden">
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
                  const filterModel = event.api.getFilterModel();
                  console.log("Filter changed:", filterModel);
                  setIsFiltering(Object.keys(filterModel).length > 0);
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

      {/* Export Dialog */}
      <Dialog
        open={exportDialog.open}
        onOpenChange={(open) =>
          !isExporting && setExportDialog({ open, format: exportDialog.format })
        }
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export Data</DialogTitle>
            <DialogDescription>
              Choose what data to export as {exportDialog.format?.toUpperCase()}
            </DialogDescription>
          </DialogHeader>
          {isExporting ? (
            <div className="py-8 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
              <p className="text-sm text-gray-600">Preparing your export...</p>
              {exportProgress.total > 0 && (
                <div className="w-full px-8">
                  <div className="text-xs text-gray-500 mb-2 text-center">
                    Loading {exportProgress.current.toLocaleString()} of{" "}
                    {exportProgress.total.toLocaleString()} rows
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gray-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          (exportProgress.current / exportProgress.total) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-4 py-4">
                <div className="rounded-lg border p-4">
                  <h4 className="font-medium mb-2">Currently loaded data</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Export {performanceStats.rowsLoaded.toLocaleString()} rows
                    currently loaded in the grid
                  </p>
                  <Button
                    onClick={() => handleExport(false)}
                    className="w-full"
                    variant="outline"
                    disabled={isExporting}
                  >
                    Export Loaded Data
                  </Button>
                </div>
                <div className="rounded-lg border p-4">
                  <h4 className="font-medium mb-2">Export all data</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Export all 100,000 rows (this may take a while)
                  </p>
                  <Button
                    onClick={() => handleExport(true)}
                    className="w-full"
                    disabled={isExporting}
                  >
                    Export All Data (100,000 rows)
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setExportDialog({ open: false, format: null })}
                  disabled={isExporting}
                >
                  Cancel
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
