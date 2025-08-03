import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

export interface ExportOptions {
  filename?: string
  includeHeaders?: boolean
}

export const exportToCSV = (data: any[], options: ExportOptions = {}) => {
  const {
    filename = `export_${new Date().toISOString().split('T')[0]}`,
    includeHeaders = true
  } = options

  if (!data || data.length === 0) {
    console.warn('No data to export')
    return
  }

  // Get headers from first row
  const headers = Object.keys(data[0])
  
  // Build CSV content
  let csvContent = ''
  
  if (includeHeaders) {
    csvContent += headers.join(',') + '\n'
  }
  
  // Add data rows
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header]
      // Escape values containing commas or quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value ?? ''
    })
    csvContent += values.join(',') + '\n'
  })
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  saveAs(blob, `${filename}.csv`)
}

export const exportToExcel = (data: any[], options: ExportOptions = {}) => {
  const {
    filename = `export_${new Date().toISOString().split('T')[0]}`,
    includeHeaders = true
  } = options

  if (!data || data.length === 0) {
    console.warn('No data to export')
    return
  }

  // Create a new workbook
  const wb = XLSX.utils.book_new()
  
  // Convert data to worksheet
  const ws = XLSX.utils.json_to_sheet(data, { header: includeHeaders ? undefined : 1 })
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Data')
  
  // Write workbook and trigger download
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], { type: 'application/octet-stream' })
  saveAs(blob, `${filename}.xlsx`)
}

export const exportData = (data: any[], format: 'csv' | 'excel', options: ExportOptions = {}) => {
  if (format === 'csv') {
    exportToCSV(data, options)
  } else if (format === 'excel') {
    exportToExcel(data, options)
  }
}