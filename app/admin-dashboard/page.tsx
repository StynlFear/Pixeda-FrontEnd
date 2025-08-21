"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useAPI } from "@/hooks/use-api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  BarChart3,
  UserCheck,
  Target
} from "lucide-react"

interface DashboardData {
  period: { start: string; end: string }
  summary: {
    orders: {
      total: number
      completed: number
      inProgress: number
      cancelled: number
      overdue: number
    }
    revenue: {
      totalRevenue: number
      totalItems: number
    }
    employees: {
      activeEmployees: number
      totalAssignments: number
    }
  }
  recentOrders: any[]
  upcomingDueDates: any[]
}

interface OrderInsights {
  ordersByStatus: Array<{ _id: string; count: number }>
  overdueOrders: any[]
  ordersByPriority: Array<{ _id: string; count: number }>
  averageCompletionTime: { avgCompletionTime: number; totalCompleted: number }
  stageBottlenecks: Array<{ _id: string; count: number; avgTimeInStage: number }>
  assignmentOverview: any[]
}

interface EmployeeInsights {
  workloadDistribution: any[]
  employeeTurnaroundTime: any[]
  employeeActivity: any[]
  summary: {
    totalEmployees: number
    activeEmployees: number
    inactiveEmployees: number
  }
}

interface ClientInsights {
  topClientsByOrders: any[]
  clientAnalysis: {
    newClients: number
    returningClients: number
    totalClients: number
  }
  atRiskClients: any[]
}

interface ProductInsights {
  productTypeStats: any[]
  revenueByProductType: any[]
  rarelyOrderedProducts: any[]
  summary: {
    totalProducts: number
    activeProducts: number
    rarelyOrderedCount: number
  }
}

interface FinancialInsights {
  totalRevenue: {
    totalRevenue: number
    orderCount: number
    totalItems: number
  }
  avgOrderValue: number
  revenueByClient: any[]
  revenueByPriority: any[]
  revenueTrend: any[]
}

interface AuditInsights {
  disabledStagesStats: any[]
  suspiciousActivity: any[]
  settingsHealth: {
    totalProducts: number
    activeEmployees: number
    totalClients: number
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function AdminDashboard() {
  const { user } = useAuth()
  const api = useAPI()
  const [period, setPeriod] = useState("30d")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // State for different insight data
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [orderInsights, setOrderInsights] = useState<OrderInsights | null>(null)
  const [employeeInsights, setEmployeeInsights] = useState<EmployeeInsights | null>(null)
  const [clientInsights, setClientInsights] = useState<ClientInsights | null>(null)
  const [productInsights, setProductInsights] = useState<ProductInsights | null>(null)
  const [financialInsights, setFinancialInsights] = useState<FinancialInsights | null>(null)
  const [auditInsights, setAuditInsights] = useState<AuditInsights | null>(null)

  // Check if user is admin
  if (user?.position !== "admin") {
    return (
      <div className="p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Access denied. This page is only available to administrators.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  useEffect(() => {
    fetchAllInsights()
  }, [period])

  const fetchAllInsights = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params = { period }
      
      const [
        dashboardResponse,
        ordersResponse,
        employeesResponse,
        clientsResponse,
        productsResponse,
        financialResponse,
        auditResponse
      ] = await Promise.all([
        api.get("api/insights/dashboard", { params }),
        api.get("api/insights/orders", { params }),
        api.get("api/insights/employees", { params }),
        api.get("api/insights/clients", { params }),
        api.get("api/insights/products", { params }),
        api.get("api/insights/financial", { params }),
        api.get("api/insights/audit", { params })
      ])

      setDashboardData(dashboardResponse.data.data)
      setOrderInsights(ordersResponse.data.data)
      setEmployeeInsights(employeesResponse.data.data)
      setClientInsights(clientsResponse.data.data)
      setProductInsights(productsResponse.data.data)
      setFinancialInsights(financialResponse.data.data)
      setAuditInsights(auditResponse.data.data)
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch insights data")
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON'
    }).format(amount)
  }

  const formatDuration = (ms: number) => {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24))
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    return `${days}d ${hours}h`
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive insights and analytics for your business
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.summary.orders.total}</div>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {dashboardData.summary.orders.completed} Done
                </Badge>
                <Badge variant="outline" className="text-red-600">
                  <Clock className="h-3 w-3 mr-1" />
                  {dashboardData.summary.orders.overdue} Overdue
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(dashboardData.summary.revenue.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                {dashboardData.summary.revenue.totalItems} items sold
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.summary.employees.activeEmployees}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardData.summary.employees.totalAssignments} total assignments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(financialInsights?.avgOrderValue || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Based on completed orders
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Insights Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-7 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest orders in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.recentOrders.map((order: any) => (
                    <div key={order._id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">
                          {order.customer?.firstName} {order.customer?.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={
                        order.status === "DONE" ? "default" :
                        order.status === "IN_PROGRESS" ? "secondary" :
                        order.status === "CANCELLED" ? "destructive" : "outline"
                      }>
                        {order.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Due Dates */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Due Dates</CardTitle>
                <CardDescription>Orders due in the next 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.upcomingDueDates.map((order: any) => (
                    <div key={order._id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">
                          {order.customer?.firstName} {order.customer?.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Due: {new Date(order.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={
                        new Date(order.dueDate) < new Date() ? "destructive" :
                        new Date(order.dueDate) < new Date(Date.now() + 24 * 60 * 60 * 1000) ? "secondary" :
                        "outline"
                      }>
                        {order.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Trend Chart */}
          {financialInsights?.revenueTrend && (
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Weekly revenue overview</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={financialInsights.revenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="_id.week" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="weeklyRevenue" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="Weekly Revenue"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-6">
          {orderInsights && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Orders by Status */}
                <Card>
                  <CardHeader>
                    <CardTitle>Orders by Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={orderInsights.ordersByStatus}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="_id"
                        >
                          {orderInsights.ordersByStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Orders by Priority */}
                <Card>
                  <CardHeader>
                    <CardTitle>Orders by Priority</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={orderInsights.ordersByPriority}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="_id" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Stage Bottlenecks */}
              <Card>
                <CardHeader>
                  <CardTitle>Stage Bottlenecks</CardTitle>
                  <CardDescription>Items stuck in each production stage</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orderInsights.stageBottlenecks.map((stage: any) => (
                      <div key={stage._id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{stage._id || "Unknown Stage"}</span>
                          <div className="text-right">
                            <span className="text-sm font-medium">{stage.count} items</span>
                            <p className="text-xs text-muted-foreground">
                              Avg time: {formatDuration(stage.avgTimeInStage)}
                            </p>
                          </div>
                        </div>
                        <Progress value={(stage.count / Math.max(...orderInsights.stageBottlenecks.map(s => s.count))) * 100} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Overdue Orders */}
              {orderInsights.overdueOrders.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600">Overdue Orders</CardTitle>
                    <CardDescription>Orders that have passed their due date</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {orderInsights.overdueOrders.slice(0, 10).map((order: any) => (
                        <div key={order._id} className="flex justify-between items-center p-2 bg-red-50 rounded">
                          <div>
                            <p className="font-medium">
                              {order.customer?.firstName} {order.customer?.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Due: {new Date(order.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant="destructive">{order.status}</Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {order.priority} Priority
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Average Completion Time */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded">
                      <p className="text-2xl font-bold text-blue-600">
                        {formatDuration(orderInsights.averageCompletionTime.avgCompletionTime || 0)}
                      </p>
                      <p className="text-sm text-muted-foreground">Average Completion Time</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded">
                      <p className="text-2xl font-bold text-green-600">
                        {orderInsights.averageCompletionTime.totalCompleted}
                      </p>
                      <p className="text-sm text-muted-foreground">Orders Completed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-6">
          {employeeInsights && (
            <>
              {/* Employee Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Total Employees</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{employeeInsights.summary.totalEmployees}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Active Employees</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">{employeeInsights.summary.activeEmployees}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Inactive Employees</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">{employeeInsights.summary.inactiveEmployees}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Workload Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Workload Distribution</CardTitle>
                  <CardDescription>Current task assignments per employee</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {employeeInsights.workloadDistribution.map((employee: any) => (
                      <div key={employee._id.employeeId} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-medium">{employee._id.employeeName}</span>
                            <span className="text-sm text-muted-foreground ml-2">({employee._id.position})</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium">{employee.totalAssignments} assignments</span>
                            <p className="text-xs text-muted-foreground">
                              {employee.completionRate.toFixed(1)}% completion rate
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Progress value={employee.completionRate} className="h-2" />
                          </div>
                          <span className="text-xs text-muted-foreground w-16">
                            {employee.completedAssignments}/{employee.totalAssignments}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-2 text-xs text-muted-foreground">
                          <div>
                            <span>Active: {employee.activeAssignments}</span>
                          </div>
                          <div>
                            <span>Total Time: {employee.totalTimeSpentFormatted?.formatted?.human}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Employee Turnaround Time */}
              <Card>
                <CardHeader>
                  <CardTitle>Employee Performance</CardTitle>
                  <CardDescription>Overall performance metrics per employee</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {employeeInsights.employeeTurnaroundTime.map((employee: any) => (
                      <div key={employee._id.employeeId} className="space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b">
                          <div>
                            <h4 className="font-medium">{employee._id.employeeName}</h4>
                            <p className="text-sm text-muted-foreground">
                              {employee.totalActiveAssignments} active assignments • {employee.totalCompletedAssignments} completed
                              {employee.totalWorkTimeFormatted?.formatted?.human && (
                                <span> • Total time: {employee.totalWorkTimeFormatted.formatted.human}</span>
                              )}
                            </p>
                          </div>
                          <div className="text-right">
                            {employee.overallAvgCompletionTimeFormatted?.formatted?.human ? (
                              <p className="font-medium">Avg Completion: {employee.overallAvgCompletionTimeFormatted.formatted.human}</p>
                            ) : (
                              <p className="font-medium text-muted-foreground">No completed assignments yet</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-gray-700">Current Stage Assignments:</p>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                            {employee.stagePerformance?.map((stage: any) => (
                              <div key={stage.stage} className="text-center p-2 bg-blue-50 rounded border">
                                <p className="text-xs font-medium text-blue-800">{stage.stage}</p>
                                <p className="text-sm font-semibold text-blue-600">
                                  {stage.activeAssignments} active
                                </p>
                                <p className="text-xs text-green-600">
                                  {stage.completedAssignments} done
                                </p>
                                {stage.avgCurrentAssignmentAgeFormatted?.formatted?.human && (
                                  <p className="text-xs text-gray-600">
                                    Age: {stage.avgCurrentAssignmentAgeFormatted.formatted.human}
                                  </p>
                                )}
                                {stage.avgCompletionTimeFormatted?.formatted?.human && (
                                  <p className="text-xs text-purple-600">
                                    Avg: {stage.avgCompletionTimeFormatted.formatted.human}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                          {employee.stagePerformance?.some((stage: any) => stage.avgCurrentAssignmentAgeFormatted?.formatted?.human) && (
                            <div className="mt-3 p-3 bg-gray-100 rounded">
                              <p className="text-xs text-gray-600">
                                <strong>Note:</strong> "Age" shows how long current assignments have been with this employee. 
                                "Avg" shows average completion time for finished assignments in each stage.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Employee Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Employee Assignment Status</CardTitle>
                  <CardDescription>All employees and their assignment completion status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {employeeInsights.employeeActivity.map((employee: any) => (
                      <div key={employee._id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${!employee.isActive ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                          <div>
                            <p className="font-medium">{employee.firstName} {employee.lastName}</p>
                            <p className="text-sm text-muted-foreground">{employee.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={!employee.isActive ? "default" : "secondary"}>
                            {employee.position}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {!employee.isActive ? "Assignments Done" : "Has Pending Assignments"}
                          </p>
                          {employee.lastActivity && (
                            <p className="text-xs text-muted-foreground">
                              Last: {new Date(employee.lastActivity).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Clients Tab */}
        <TabsContent value="clients" className="space-y-6">
          {clientInsights && (
            <>
              {/* Client Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>New Clients</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">{clientInsights.clientAnalysis.newClients}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Returning Clients</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">{clientInsights.clientAnalysis.returningClients}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Total Active Clients</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{clientInsights.clientAnalysis.totalClients}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Clients */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Clients by Orders</CardTitle>
                  <CardDescription>Clients with the most orders in selected period</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {clientInsights.topClientsByOrders.map((client: any, index: number) => (
                      <div key={client._id.clientId} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{client._id.clientName}</p>
                            <p className="text-sm text-muted-foreground">
                              Last order: {new Date(client.lastOrderDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{client.orderCount} orders</p>
                          <p className="text-sm text-green-600">{formatCurrency(client.totalRevenue)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* At-Risk Clients */}
              {clientInsights.atRiskClients.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600">At-Risk Clients</CardTitle>
                    <CardDescription>Clients with cancelled or overdue orders</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {clientInsights.atRiskClients.map((client: any) => (
                        <div key={client._id.clientId} className="flex justify-between items-center p-3 bg-red-50 rounded">
                          <div>
                            <p className="font-medium">{client._id.clientName}</p>
                            <p className="text-sm text-muted-foreground">
                              {client.totalProblematicOrders} problematic orders
                            </p>
                          </div>
                          <div className="text-right">
                            {client.cancelledOrders > 0 && (
                              <Badge variant="destructive" className="mr-2">
                                {client.cancelledOrders} cancelled
                              </Badge>
                            )}
                            {client.overdueOrders > 0 && (
                              <Badge variant="secondary">
                                {client.overdueOrders} overdue
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          {productInsights && (
            <>
              {/* Product Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Total Products</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{productInsights.summary.totalProducts}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Active Products</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">{productInsights.summary.activeProducts}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Rarely Ordered</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">{productInsights.summary.rarelyOrderedCount}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue by Product Type */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Product Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={productInsights.revenueByProductType}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="_id" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Bar dataKey="totalRevenue" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Most Ordered Products */}
              <Card>
                <CardHeader>
                  <CardTitle>Most Ordered Products</CardTitle>
                  <CardDescription>Products with highest order quantities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {productInsights.productTypeStats.slice(0, 10).map((product: any, index: number) => (
                      <div key={`${product._id.productType}-${product._id.productName}`} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{product._id.productName || product._id.productType}</p>
                            <p className="text-sm text-muted-foreground">Type: {product._id.productType}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{product.orderCount} units</p>
                          <p className="text-sm text-green-600">{formatCurrency(product.totalRevenue)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-6">
          {financialInsights && (
            <>
              {/* Financial Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Total Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      {formatCurrency(financialInsights.totalRevenue.totalRevenue)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      From {financialInsights.totalRevenue.orderCount} orders
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Average Order Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">
                      {formatCurrency(financialInsights.avgOrderValue)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Total Items Sold</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {financialInsights.totalRevenue.totalItems}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue by Priority */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Priority</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={financialInsights.revenueByPriority}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="revenue"
                        nameKey="_id"
                      >
                        {financialInsights.revenueByPriority.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Revenue Clients */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Revenue Clients</CardTitle>
                  <CardDescription>Clients contributing most to revenue</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {financialInsights.revenueByClient.map((client: any, index: number) => (
                      <div key={client._id.clientId} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{client._id.clientName}</p>
                            <p className="text-sm text-muted-foreground">{client.orderCount} orders</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-600">{formatCurrency(client.revenue)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit" className="space-y-6">
          {auditInsights && (
            <>
              {/* Settings Health */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Total Products</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{auditInsights.settingsHealth.totalProducts}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Active Employees</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{auditInsights.settingsHealth.activeEmployees}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Total Clients</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{auditInsights.settingsHealth.totalClients}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Disabled Stages Statistics */}
              {auditInsights.disabledStagesStats.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Disabled Stages Statistics</CardTitle>
                    <CardDescription>Stages that are frequently skipped</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {auditInsights.disabledStagesStats.map((stage: any) => (
                        <div key={stage._id} className="flex justify-between items-center p-3 bg-yellow-50 rounded">
                          <div>
                            <p className="font-medium">{stage._id}</p>
                            <p className="text-sm text-muted-foreground">Disabled stage</p>
                          </div>
                          <div>
                            <Badge variant="secondary">{stage.count} times</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Suspicious Activity */}
              {auditInsights.suspiciousActivity.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-orange-600">Recent Activity</CardTitle>
                    <CardDescription>Orders with recent changes or quick cancellations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {auditInsights.suspiciousActivity.map((activity: any) => (
                        <div key={activity._id} className="flex justify-between items-center p-3 bg-orange-50 rounded">
                          <div>
                            <p className="font-medium">{activity.clientName}</p>
                            <p className="text-sm text-muted-foreground">
                              Created: {new Date(activity.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant={activity.status === "CANCELLED" ? "destructive" : "secondary"}>
                              {activity.status}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {activity.priority} Priority
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* System Health Note */}
              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert>
                    <Activity className="h-4 w-4" />
                    <AlertDescription>
                      Full audit logging not yet implemented. This shows basic system health and activity patterns.
                      Consider implementing comprehensive audit trails for better security monitoring.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}