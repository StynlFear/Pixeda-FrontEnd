"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { AppLayout } from "@/components/layout/app-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, AlertTriangle, CheckCircle, Package, Calendar, User, Loader2 } from "lucide-react"
import { PRIORITY_LABELS } from "@/lib/constants"
import api from "@/lib/axios"

// Types
type OrderStatus = "TO_DO" | "READY_TO_BE_TAKEN" | "IN_EXECUTION" | "IN_PAUSE" | "IN_PROGRESS" | "DONE" | "CANCELLED"
type Priority = "LOW" | "NORMAL" | "HIGH" | "URGENT"
type ItemStage = "TO_DO" | "GRAPHICS" | "PRINTING" | "CUTTING" | "FINISHING" | "PACKING" | "DONE" | "STANDBY" | "CANCELLED"

interface TaskItem {
  orderId: string
  itemId: string
  assignmentId: string
  orderNumber: string
  productName: string
  quantity: number
  client: string
  dueDate: string
  currentStage: ItemStage
  priority: Priority
  assignedTo: string
  isUnassigned: boolean
}

const stageColumns = [
  { key: "TO_DO" as ItemStage, label: "To Do", color: "bg-gray-100" },
  { key: "GRAPHICS" as ItemStage, label: "Graphics", color: "bg-blue-100" },
  { key: "PRINTING" as ItemStage, label: "Printing", color: "bg-yellow-100" },
  { key: "CUTTING" as ItemStage, label: "Cutting", color: "bg-orange-100" },
  { key: "FINISHING" as ItemStage, label: "Finishing", color: "bg-purple-100" },
  { key: "PACKING" as ItemStage, label: "Packing", color: "bg-green-100" },
]

function getPriorityColor(priority: string) {
  switch (priority) {
    case "URGENT":
      return "bg-red-500"
    case "HIGH":
      return "bg-orange-500"
    case "NORMAL":
      return "bg-blue-500"
    case "LOW":
      return "bg-gray-500"
    default:
      return "bg-gray-500"
  }
}

function isTaskOverdue(dueDate: string): boolean {
  return new Date(dueDate) < new Date()
}

function isTaskDueSoon(dueDate: string): boolean {
  const due = new Date(dueDate)
  const now = new Date()
  const diffTime = due.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays <= 2 && diffDays >= 0
}

// Component for updating item stage
function StageUpdateSelect({ 
  item, 
  onStatusUpdate 
}: { 
  item: TaskItem
  onStatusUpdate: (itemId: string, assignmentId: string, newStage: ItemStage) => Promise<void>
}) {
  const [updating, setUpdating] = useState(false)

  const handleStageChange = async (newStage: ItemStage) => {
    setUpdating(true)
    try {
      await onStatusUpdate(item.itemId, item.assignmentId, newStage)
    } catch (error) {
      console.error("Failed to update stage:", error)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <Select value={item.currentStage} onValueChange={handleStageChange} disabled={updating}>
      <SelectTrigger className="w-full text-xs h-6">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="TO_DO">To Do</SelectItem>
        <SelectItem value="GRAPHICS">Graphics</SelectItem>
        <SelectItem value="PRINTING">Printing</SelectItem>
        <SelectItem value="CUTTING">Cutting</SelectItem>
        <SelectItem value="FINISHING">Finishing</SelectItem>
        <SelectItem value="PACKING">Packing</SelectItem>
        <SelectItem value="DONE">Done</SelectItem>
        <SelectItem value="STANDBY">Standby</SelectItem>
        <SelectItem value="CANCELLED">Cancelled</SelectItem>
      </SelectContent>
    </Select>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const isAdmin = user?.position === "admin"
  const [taskItems, setTaskItems] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const breadcrumbs = [{ label: "Dashboard" }]

  // Fetch orders and transform them into task items
  useEffect(() => {
    const fetchTaskItems = async () => {
      try {
        setLoading(true)
        setError(null)
        
        let allOrders: any[] = []
        let page = 1
        const limit = 50 // Use smaller, more reasonable limit
        
        // Fetch orders with pagination
        while (true) {
          const response = await api.get("/api/orders", {
            params: {
              page,
              limit,
              sortBy: "dueDate",
              order: "asc"
            }
          })

          const orders = response.data?.data || response.data?.orders || response.data?.items || []
          allOrders = [...allOrders, ...orders]
          
          // Check if we have more pages
          const total = response.data?.total || 0
          const hasMore = (page * limit) < total
          
          if (!hasMore || orders.length === 0) break
          page++
          
          // Safety limit to prevent infinite loops
          if (page > 10) break
        }

        const tasks: TaskItem[] = []

        // Transform orders into task items
        for (const order of allOrders) {
          if (!order.items || !Array.isArray(order.items)) continue

          const clientName = order.customerCompany?.name || 
                           `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim() ||
                           'Unknown Client'

          for (const item of order.items) {
            // Get the current stage of the item
            const currentStage = item.itemStatus || 'TO_DO'
            
            if (isAdmin) {
              // Admin sees all items, regardless of assignments
              tasks.push({
                orderId: order._id,
                itemId: item._id,
                assignmentId: item._id, // Use item ID as fallback for admin view
                orderNumber: order.orderNumber || `Order ${order._id}`,
                productName: item.productNameSnapshot || 'Unknown Product',
                quantity: item.quantity || 1,
                client: clientName,
                dueDate: order.dueDate || '',
                currentStage: currentStage,
                priority: order.priority || 'NORMAL',
                assignedTo: 'All Users', // Admin view shows all
                isUnassigned: false
              })
            } else {
              // For non-admin users, check assignments
              if (!item.assignments || !Array.isArray(item.assignments)) {
                // If no assignments exist, show item as unassigned and available for pickup
                tasks.push({
                  orderId: order._id,
                  itemId: item._id,
                  assignmentId: item._id, // Use item ID as fallback
                  orderNumber: order.orderNumber || `Order ${order._id}`,
                  productName: item.productNameSnapshot || 'Unknown Product',
                  quantity: item.quantity || 1,
                  client: clientName,
                  dueDate: order.dueDate || '',
                  currentStage: currentStage,
                  priority: order.priority || 'NORMAL',
                  assignedTo: 'Not assigned to anyone',
                  isUnassigned: true
                })
                continue
              }

              // Find the assignment for the current stage
              const currentAssignment = item.assignments.find((assignment: any) => assignment.stage === currentStage)
              
              // If no assignment for current stage, show as unassigned and available
              if (!currentAssignment) {
                tasks.push({
                  orderId: order._id,
                  itemId: item._id,
                  assignmentId: item._id, // Use item ID as fallback
                  orderNumber: order.orderNumber || `Order ${order._id}`,
                  productName: item.productNameSnapshot || 'Unknown Product',
                  quantity: item.quantity || 1,
                  client: clientName,
                  dueDate: order.dueDate || '',
                  currentStage: currentStage,
                  priority: order.priority || 'NORMAL',
                  assignedTo: 'Not assigned to anyone',
                  isUnassigned: true
                })
                continue
              }

              // Handle both object and string formats for assignedTo
              const assignedToId = typeof currentAssignment.assignedTo === 'object' && currentAssignment.assignedTo 
                ? currentAssignment.assignedTo._id 
                : currentAssignment.assignedTo

              // Only show items that are assigned to the current user
              if (assignedToId !== user?._id) continue

              tasks.push({
                orderId: order._id,
                itemId: item._id,
                assignmentId: currentAssignment._id,
                orderNumber: order.orderNumber || `Order ${order._id}`,
                productName: item.productNameSnapshot || 'Unknown Product',
                quantity: item.quantity || 1,
                client: clientName,
                dueDate: order.dueDate || '',
                currentStage: currentStage,
                priority: order.priority || 'NORMAL',
                assignedTo: assignedToId,
                isUnassigned: false
              })
            }
          }
        }

        setTaskItems(tasks)
      } catch (err: any) {
        console.error("Failed to fetch task items:", err)
        setError(err?.response?.data?.message || "Failed to load tasks")
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchTaskItems()
    }
  }, [user, isAdmin])

  // Handle status updates
  const handleStatusUpdate = async (itemId: string, assignmentId: string, newStage: ItemStage) => {
    try {
      // Find the order that contains this item
      const item = taskItems.find(t => t.itemId === itemId && t.assignmentId === assignmentId)
      if (!item) return

      // Update the item status (this is the main status that determines which column it appears in)
      try {
        await api.patch(`/api/orders/${item.orderId}/items/${itemId}/status`, {
          itemStatus: newStage
        })
      } catch (error: any) {
        // Fallback: try updating the assignment
        await api.patch(`/api/orders/${item.orderId}/items/${itemId}/status`, {
          stage: newStage
        })
      }

      // Update local state
      setTaskItems(prev => prev.map(task => 
        task.itemId === itemId && task.assignmentId === assignmentId
          ? { ...task, currentStage: newStage }
          : task
      ))
    } catch (error) {
      console.error("Failed to update status:", error)
      throw error
    }
  }

  // Handle self-assignment
  const handleSelfAssignment = async (itemId: string, orderId: string, stage: ItemStage) => {
    try {
      // Get current order to find the item and update only its assignment
      const orderResponse = await api.get(`/api/orders/${orderId}`)
      const orderData = orderResponse.data

      // Find the item and update its assignment
      const updatedItems = orderData.items.map((item: any) => {
        if (item._id === itemId) {
          const existingAssignments = item.assignments || []
          const assignmentIndex = existingAssignments.findIndex((assignment: any) => assignment.stage === stage)
          
          let updatedAssignments
          if (assignmentIndex >= 0) {
            // Update existing assignment
            updatedAssignments = existingAssignments.map((assignment: any, index: number) => 
              index === assignmentIndex 
                ? { 
                    ...assignment, 
                    assignedTo: user?._id,
                    assignedAt: new Date().toISOString(),
                    isActive: true
                  }
                : assignment
            )
          } else {
            // Add new assignment with proper structure
            updatedAssignments = [
              ...existingAssignments,
              {
                stage: stage,
                assignedTo: user?._id,
                isActive: true,
                assignedAt: new Date().toISOString(),
                stageNotes: ""
              }
            ]
          }
          
          return {
            ...item,
            product: item.product?._id || item.product, // Send only product ID
            assignments: updatedAssignments.map((assignment: any) => ({
              ...assignment,
              assignedTo: typeof assignment.assignedTo === 'object' && assignment.assignedTo 
                ? assignment.assignedTo._id 
                : assignment.assignedTo // Send only user ID
            }))
          }
        }
        return {
          ...item,
          product: item.product?._id || item.product, // Send only product ID
          assignments: (item.assignments || []).map((assignment: any) => ({
            ...assignment,
            assignedTo: typeof assignment.assignedTo === 'object' && assignment.assignedTo 
              ? assignment.assignedTo._id 
              : assignment.assignedTo // Send only user ID
          }))
        }
      })

      // Send the complete order data with IDs only
      const updatePayload = {
        ...orderData,
        customer: orderData.customer?._id || orderData.customer, // Send only customer ID
        customerCompany: orderData.customerCompany?._id || orderData.customerCompany, // Send only company ID if exists
        items: updatedItems
      }

      await api.put(`/api/orders/${orderId}`, updatePayload)

      // Update local state
      setTaskItems(prev => prev.map(task => 
        task.itemId === itemId && task.isUnassigned
          ? { 
              ...task, 
              assignedTo: user?._id || '',
              isUnassigned: false
            }
          : task
      ))
    } catch (error) {
      console.error("Failed to assign task:", error)
      throw error
    }
  }

  // Calculate stats - excluding completed and cancelled items from active stats
  const activeItems = taskItems.filter(item => 
    item.currentStage !== 'DONE' && item.currentStage !== 'CANCELLED'
  )
  
  const stats = {
    todayItems: activeItems.filter(item => {
      const today = new Date().toDateString()
      return new Date(item.dueDate).toDateString() === today
    }).length,
    overdueItems: activeItems.filter(item => isTaskOverdue(item.dueDate)).length,
    urgentItems: activeItems.filter(item => item.priority === 'URGENT' || item.priority === 'HIGH').length,
    completedToday: taskItems.filter(item => {
      const today = new Date().toDateString()
      return item.currentStage === 'DONE' && new Date().toDateString() === today
    }).length,
  }

  return (
    <ProtectedRoute>
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Items Today</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.todayItems}</div>
                <p className="text-xs text-muted-foreground">Due today</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{stats.overdueItems}</div>
                <p className="text-xs text-muted-foreground">Needs immediate attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High Priority</CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-500">{stats.urgentItems}</div>
                <p className="text-xs text-muted-foreground">Urgent & high priority items</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                <CheckCircle className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">{activeItems.length}</div>
                <p className="text-xs text-muted-foreground">{isAdmin ? 'Active assignments' : 'Your assignments + unassigned items'}</p>
              </CardContent>
            </Card>
          </div>

          {/* Task Board */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{isAdmin ? 'All Task Items' : 'My Task Board'}</CardTitle>
                  <CardDescription>
                    {isAdmin 
                      ? 'All items in the system organized by workflow stage' 
                      : 'Items assigned to you and unassigned items organized by workflow stage'
                    }
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading your tasks...</span>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-destructive">
                  <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
                  <p>{error}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                  {stageColumns.map((stage) => {
                    const stageItems = taskItems.filter((item) => item.currentStage === stage.key)
                    
                    return (
                      <div key={stage.key} className="space-y-3">
                        <div className={`p-3 rounded-lg ${stage.color}`}>
                          <h3 className="font-medium text-sm">{stage.label}</h3>
                          <p className="text-xs text-muted-foreground">
                            {stageItems.length} items
                          </p>
                        </div>

                        <div className="space-y-2">
                          {stageItems.map((item) => (
                            <Card 
                              key={`${item.itemId}-${item.assignmentId}`} 
                              className={`p-3 hover:shadow-md transition-shadow cursor-pointer ${
                                isTaskOverdue(item.dueDate) ? 'border-red-200 bg-red-50' :
                                isTaskDueSoon(item.dueDate) ? 'border-yellow-200 bg-yellow-50' : ''
                              }`}
                            >
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-mono text-primary">{item.orderNumber}</span>
                                  <Badge
                                    variant="secondary"
                                    className={`text-xs ${getPriorityColor(item.priority)} text-white`}
                                  >
                                    {PRIORITY_LABELS[item.priority as keyof typeof PRIORITY_LABELS]}
                                  </Badge>
                                </div>

                                <div>
                                  <p className="font-medium text-sm">{item.productName}</p>
                                  <p className="text-xs text-muted-foreground">Qty: {item.quantity} • {item.client}</p>
                                </div>

                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  <span className={isTaskOverdue(item.dueDate) ? 'text-red-600 font-medium' : ''}>
                                    {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'No due date'}
                                  </span>
                                </div>

                                {/* Assignment Status */}
                                <div className="flex items-center gap-1 text-xs">
                                  <User className="h-3 w-3" />
                                  <span className={item.isUnassigned ? 'text-orange-600 font-medium' : 'text-muted-foreground'}>
                                    {item.assignedTo === 'Not assigned to anyone' ? 'Not assigned to anyone' : 
                                     item.assignedTo === user?._id ? 'Assigned to you' : 
                                     item.assignedTo}
                                  </span>
                                </div>

                                <div className="space-y-1 pt-2">
                                  {/* Show assignment button for unassigned items */}
                                  {item.isUnassigned && !isAdmin && (
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="text-xs h-6 w-full"
                                      onClick={async () => {
                                        try {
                                          await handleSelfAssignment(item.itemId, item.orderId, item.currentStage)
                                        } catch (error) {
                                          console.error("Failed to assign task:", error)
                                        }
                                      }}
                                    >
                                      Assign to Me
                                    </Button>
                                  )}
                                  
                                  <StageUpdateSelect 
                                    item={item} 
                                    onStatusUpdate={handleStatusUpdate}
                                  />
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="text-xs h-6 w-full"
                                    onClick={() => window.open(`/orders/${item.orderId}`, '_blank')}
                                  >
                                    View Order
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
