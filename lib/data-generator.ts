import { ColDef } from "ag-grid-community"

export interface DataRow {
  id: string
  [key: string]: any
}

// Base user data structure from API
interface BaseUser {
  id: number
  name: string
  username: string
  email: string
  address: {
    street: string
    suite: string
    city: string
    zipcode: string
    geo: {
      lat: string
      lng: string
    }
  }
  phone: string
  website: string
  company: {
    name: string
    catchPhrase: string
    bs: string
  }
}

// Expand a single user into multiple columns
function expandUserData(user: BaseUser, rowIndex: number): DataRow {
  const expandedRow: DataRow = {
    id: `row_${rowIndex}`,
    user_id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    phone: user.phone,
    website: user.website,
    
    // Address fields
    address_street: user.address.street,
    address_suite: user.address.suite,
    address_city: user.address.city,
    address_zipcode: user.address.zipcode,
    address_lat: parseFloat(user.address.geo.lat),
    address_lng: parseFloat(user.address.geo.lng),
    
    // Company fields
    company_name: user.company.name,
    company_catchphrase: user.company.catchPhrase,
    company_bs: user.company.bs,
    
    // Generated financial data
    revenue: Math.floor(Math.random() * 1000000),
    expenses: Math.floor(Math.random() * 800000),
    profit: Math.floor(Math.random() * 200000),
    employees: Math.floor(Math.random() * 1000) + 10,
    
    // Generated dates
    created_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    last_login: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    next_review: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
    
    // Generated metrics (50+ additional columns)
    ...generateMetrics(rowIndex),
    
    // Generated status fields
    status: Math.random() > 0.5 ? 'Active' : 'Inactive',
    verified: Math.random() > 0.3,
    premium: Math.random() > 0.7,
    subscription_tier: ['Free', 'Basic', 'Pro', 'Enterprise'][Math.floor(Math.random() * 4)],
  }
  
  return expandedRow
}

// Generate 80+ metric columns
function generateMetrics(rowIndex: number): Record<string, any> {
  const metrics: Record<string, any> = {}
  
  // Performance metrics (20 columns)
  for (let i = 1; i <= 20; i++) {
    metrics[`performance_metric_${i}`] = (Math.random() * 100).toFixed(2)
  }
  
  // Sales metrics (20 columns)
  for (let i = 1; i <= 20; i++) {
    metrics[`sales_metric_${i}`] = Math.floor(Math.random() * 10000)
  }
  
  // User behavior metrics (20 columns)
  for (let i = 1; i <= 20; i++) {
    metrics[`behavior_metric_${i}`] = Math.floor(Math.random() * 1000)
  }
  
  // Custom KPIs (20 columns)
  for (let i = 1; i <= 20; i++) {
    metrics[`kpi_${i}`] = (Math.random() * 1000).toFixed(3)
  }
  
  // Add some calculated fields
  metrics.total_score = (Math.random() * 1000).toFixed(2)
  metrics.risk_factor = (Math.random() * 10).toFixed(2)
  metrics.satisfaction_score = (Math.random() * 5).toFixed(2)
  metrics.engagement_rate = (Math.random() * 100).toFixed(2)
  metrics.conversion_rate = (Math.random() * 100).toFixed(2)
  
  return metrics
}

// Fetch base data from JSONPlaceholder API
export async function fetchBaseUsers(): Promise<BaseUser[]> {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/users')
    if (!response.ok) {
      throw new Error('Failed to fetch users')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching users:', error)
    // Return mock data if API fails
    return generateMockUsers(10)
  }
}

// Generate mock users if API fails
function generateMockUsers(count: number): BaseUser[] {
  const users: BaseUser[] = []
  for (let i = 0; i < count; i++) {
    users.push({
      id: i + 1,
      name: `User ${i + 1}`,
      username: `user${i + 1}`,
      email: `user${i + 1}@example.com`,
      address: {
        street: `${i + 1} Main St`,
        suite: `Suite ${i + 1}`,
        city: 'Sample City',
        zipcode: `${10000 + i}`,
        geo: {
          lat: `${40 + Math.random()}`,
          lng: `${-74 + Math.random()}`
        }
      },
      phone: `555-${1000 + i}`,
      website: `user${i + 1}.com`,
      company: {
        name: `Company ${i + 1}`,
        catchPhrase: 'Innovative solutions',
        bs: 'business synergy'
      }
    })
  }
  return users
}

// Generate large dataset from base users
export async function generateLargeDataset(
  startRow: number,
  endRow: number,
  columns: ColDef[]
): Promise<DataRow[]> {
  // Cache base users
  if (!globalThis.baseUsers) {
    globalThis.baseUsers = await fetchBaseUsers()
  }
  
  const baseUsers = globalThis.baseUsers as BaseUser[]
  const data: DataRow[] = []
  
  for (let i = startRow; i < endRow; i++) {
    // Cycle through base users and add variation
    const userIndex = i % baseUsers.length
    const user = baseUsers[userIndex]
    const expandedData = expandUserData(user, i)
    
    // Add row-specific variations
    const rowData: DataRow = {
      ...expandedData,
      row_number: i,
      batch_id: Math.floor(i / 100),
      segment: `Segment_${Math.floor(i / 1000)}`,
      cohort: `Cohort_${Math.floor(i / 5000)}`,
      random_value: Math.random(),
      timestamp: new Date().toISOString(),
    }
    
    data.push(rowData)
  }
  
  return data
}

// Generate column definitions with 100+ columns
export function generateColumnDefinitions(): ColDef[] {
  const columns: ColDef[] = [
    { field: 'id', headerName: 'ID', width: 100, pinned: 'left', filter: 'agTextColumnFilter', editable: false },
    { field: 'row_number', headerName: 'Row #', width: 100, filter: 'agNumberColumnFilter' },
    { field: 'user_id', headerName: 'User ID', width: 100, filter: 'agNumberColumnFilter' },
    { field: 'name', headerName: 'Name', width: 150, filter: 'agTextColumnFilter' },
    { field: 'username', headerName: 'Username', width: 120, filter: 'agTextColumnFilter' },
    { field: 'email', headerName: 'Email', width: 200, filter: 'agTextColumnFilter' },
    { field: 'phone', headerName: 'Phone', width: 150, filter: 'agTextColumnFilter' },
    { field: 'website', headerName: 'Website', width: 150, filter: 'agTextColumnFilter' },
    
    // Address columns
    { field: 'address_street', headerName: 'Street', width: 150, filter: 'agTextColumnFilter' },
    { field: 'address_suite', headerName: 'Suite', width: 100, filter: 'agTextColumnFilter' },
    { field: 'address_city', headerName: 'City', width: 120, filter: 'agTextColumnFilter' },
    { field: 'address_zipcode', headerName: 'Zipcode', width: 100, filter: 'agTextColumnFilter' },
    { field: 'address_lat', headerName: 'Latitude', width: 120, filter: 'agNumberColumnFilter' },
    { field: 'address_lng', headerName: 'Longitude', width: 120, filter: 'agNumberColumnFilter' },
    
    // Company columns
    { field: 'company_name', headerName: 'Company', width: 150, filter: 'agTextColumnFilter' },
    { field: 'company_catchphrase', headerName: 'Catchphrase', width: 200, filter: 'agTextColumnFilter' },
    { field: 'company_bs', headerName: 'Business', width: 150, filter: 'agTextColumnFilter' },
    
    // Financial columns
    { field: 'revenue', headerName: 'Revenue', width: 120, filter: 'agNumberColumnFilter' },
    { field: 'expenses', headerName: 'Expenses', width: 120, filter: 'agNumberColumnFilter' },
    { field: 'profit', headerName: 'Profit', width: 120, filter: 'agNumberColumnFilter' },
    { field: 'employees', headerName: 'Employees', width: 120, filter: 'agNumberColumnFilter' },
    
    // Date columns
    { field: 'created_date', headerName: 'Created', width: 150, filter: 'agDateColumnFilter' },
    { field: 'last_login', headerName: 'Last Login', width: 150, filter: 'agDateColumnFilter' },
    { field: 'next_review', headerName: 'Next Review', width: 150, filter: 'agDateColumnFilter' },
    
    // Status columns
    { field: 'status', headerName: 'Status', width: 100, filter: 'agSetColumnFilter', filterParams: { values: ['Active', 'Inactive'] }, cellEditor: 'agSelectCellEditor', cellEditorParams: { values: ['Active', 'Inactive'] } },
    { field: 'verified', headerName: 'Verified', width: 100, filter: 'agSetColumnFilter', filterParams: { values: [true, false] }, cellEditor: 'agCheckboxCellEditor' },
    { field: 'premium', headerName: 'Premium', width: 100, filter: 'agSetColumnFilter', filterParams: { values: [true, false] }, cellEditor: 'agCheckboxCellEditor' },
    { field: 'subscription_tier', headerName: 'Tier', width: 120, filter: 'agSetColumnFilter', filterParams: { values: ['Free', 'Basic', 'Pro', 'Enterprise'] }, cellEditor: 'agSelectCellEditor', cellEditorParams: { values: ['Free', 'Basic', 'Pro', 'Enterprise'] } },
    
    // Metadata columns
    { field: 'batch_id', headerName: 'Batch ID', width: 100, filter: 'agNumberColumnFilter' },
    { field: 'segment', headerName: 'Segment', width: 120, filter: 'agTextColumnFilter' },
    { field: 'cohort', headerName: 'Cohort', width: 120, filter: 'agTextColumnFilter' },
    { field: 'random_value', headerName: 'Random', width: 100, filter: 'agNumberColumnFilter' },
    { field: 'timestamp', headerName: 'Timestamp', width: 180, filter: 'agDateColumnFilter' },
  ]
  
  // Add performance metric columns (20)
  for (let i = 1; i <= 20; i++) {
    columns.push({
      field: `performance_metric_${i}`,
      headerName: `Perf ${i}`,
      width: 100,
      filter: 'agNumberColumnFilter',
      editable: true
    })
  }
  
  // Add sales metric columns (20)
  for (let i = 1; i <= 20; i++) {
    columns.push({
      field: `sales_metric_${i}`,
      headerName: `Sales ${i}`,
      width: 100,
      filter: 'agNumberColumnFilter',
      editable: true
    })
  }
  
  // Add behavior metric columns (20)
  for (let i = 1; i <= 20; i++) {
    columns.push({
      field: `behavior_metric_${i}`,
      headerName: `Behavior ${i}`,
      width: 100,
      filter: 'agNumberColumnFilter',
      editable: true
    })
  }
  
  // Add KPI columns (20)
  for (let i = 1; i <= 20; i++) {
    columns.push({
      field: `kpi_${i}`,
      headerName: `KPI ${i}`,
      width: 100,
      filter: 'agNumberColumnFilter'
    })
  }
  
  // Add calculated field columns
  columns.push(
    { field: 'total_score', headerName: 'Total Score', width: 120, filter: 'agNumberColumnFilter' },
    { field: 'risk_factor', headerName: 'Risk Factor', width: 120, filter: 'agNumberColumnFilter' },
    { field: 'satisfaction_score', headerName: 'Satisfaction', width: 120, filter: 'agNumberColumnFilter' },
    { field: 'engagement_rate', headerName: 'Engagement %', width: 120, filter: 'agNumberColumnFilter' },
    { field: 'conversion_rate', headerName: 'Conversion %', width: 120, filter: 'agNumberColumnFilter' },
  )
  
  // Return columns as-is, since we already set filter types
  return columns
}

// Declare global variable for TypeScript
declare global {
  var baseUsers: BaseUser[] | undefined
}