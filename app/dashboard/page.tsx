"use client"

import { useEffect, useState } from "react"
import React from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AppLayout } from "@/components/layout/app-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Clock, AlertTriangle, CheckCircle, Package, Calendar, User, Loader2, FileText, Info, Target, ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react"
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
  // Enhanced fields for better task visibility
  productDescription?: string
  specialInstructions?: string
  stageNotes?: string
  productType?: string
  productSize?: string
  productMaterial?: string
  orderNotes?: string
  clientNotes?: string
  nextStage?: ItemStage | null
  // Additional item-specific information
  textToPrint?: string
  disabledStages?: ItemStage[]
  itemDescription?: string
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

// Helper function to get stage-specific instructions
function getStageInstructions(stage: ItemStage): string {
  switch (stage) {
    case "TO_DO":
      return "Ready to be assigned and started"
    case "GRAPHICS":
      return "Create/review graphics design, prepare files for production"
    case "PRINTING":
      return "Print materials according to specifications"
    case "CUTTING":
      return "Cut printed materials to required dimensions"
    case "FINISHING":
      return "Apply finishing touches (lamination, binding, etc.)"
    case "PACKING":
      return "Package items for delivery/pickup"
    case "DONE":
      return "Task completed"
    case "STANDBY":
      return "On hold - awaiting further instructions"
    case "CANCELLED":
      return "Task cancelled"
    default:
      return "Follow standard procedures for this stage"
  }
}

// Helper function to get next stage
function getNextStage(currentStage: ItemStage): ItemStage | null {
  const stageOrder: ItemStage[] = ["TO_DO", "GRAPHICS", "PRINTING", "CUTTING", "FINISHING", "PACKING", "DONE"]
  const currentIndex = stageOrder.indexOf(currentStage)
  if (currentIndex >= 0 && currentIndex < stageOrder.length - 1) {
    return stageOrder[currentIndex + 1]
  }
  return null
}

// Helper function to get priority context
function getPriorityContext(priority: Priority): string {
  switch (priority) {
    case "URGENT":
      return "⚡ Drop everything - complete ASAP"
    case "HIGH":
      return "🔥 High priority - complete today if possible"
    case "NORMAL":
      return "📋 Standard priority"
    case "LOW":
      return "⏳ Low priority - complete when time allows"
    default:
      return "📋 Standard priority"
  }
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

  // Filter out disabled stages from the dropdown
  const availableStages = [
    { value: "TO_DO", label: "To Do" },
    { value: "GRAPHICS", label: "Graphics" },
    { value: "PRINTING", label: "Printing" },
    { value: "CUTTING", label: "Cutting" },
    { value: "FINISHING", label: "Finishing" },
    { value: "PACKING", label: "Packing" },
    { value: "DONE", label: "Done" },
    { value: "STANDBY", label: "Standby" },
    { value: "CANCELLED", label: "Cancelled" }
  ].filter(stage => !item.disabledStages?.includes(stage.value as ItemStage))

  return (
    <Select value={item.currentStage} onValueChange={handleStageChange} disabled={updating}>
      <SelectTrigger className="w-full text-xs h-6">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {availableStages.map(stage => (
          <SelectItem key={stage.value} value={stage.value}>
            {stage.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// Component for highlighting important information
function TaskHighlight({ 
  children, 
  type = 'info' 
}: { 
  children: React.ReactNode
  type?: 'info' | 'warning' | 'success' | 'instructions'
}) {
  const styles = {
    info: 'bg-blue-50 border-blue-100 text-blue-900',
    warning: 'bg-amber-50 border-amber-100 text-amber-900',
    success: 'bg-green-50 border-green-100 text-green-900',
    instructions: 'bg-purple-50 border-purple-100 text-purple-900'
  }

  return (
    <div className={`p-2 rounded-md border ${styles[type]}`}>
      {children}
    </div>
  )
}

// Expandable Task Card Component
function ExpandableTaskCard({ 
  item, 
  onStatusUpdate, 
  handleSelfAssignment, 
  user, 
  isAdmin,
  router
}: {
  item: TaskItem
  onStatusUpdate: (itemId: string, assignmentId: string, newStage: ItemStage) => Promise<void>
  handleSelfAssignment: (itemId: string, orderId: string, stage: ItemStage) => Promise<void>
  user: any
  isAdmin: boolean
  router: any
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card 
      className={`p-2 hover:shadow-md transition-shadow cursor-pointer ${
        isTaskOverdue(item.dueDate) ? 'border-red-200 bg-red-50' :
        isTaskDueSoon(item.dueDate) ? 'border-yellow-200 bg-yellow-50' : ''
      }`}
    >
      <div className="space-y-2">
        {/* Header with Order Number, Priority, and Expand Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <span className="text-xs font-mono text-primary font-bold truncate">{item.orderNumber}</span>
            <Badge
              variant="secondary"
              className={`text-xs ${getPriorityColor(item.priority)} text-white flex-shrink-0`}
            >
              {item.priority === 'URGENT' ? '🚨' : item.priority === 'HIGH' ? '🔥' : '📋'}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 flex-shrink-0"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </div>

        {/* Basic Product Info - Always Visible */}
        <div>
          <p className="font-medium text-xs leading-tight truncate">{item.productName}</p>
          <p className="text-xs text-muted-foreground truncate">Qty: {item.quantity} • {item.client}</p>
          {/* Assignment Status - Always Visible */}
          <div className="flex items-center gap-1 text-xs mt-1">
            <User className="h-3 w-3" />
            <span className={item.isUnassigned ? 'text-orange-600 font-medium' : 'text-muted-foreground'}>
              {item.assignedTo === 'Not assigned to anyone' ? 'Available for pickup' : 
               item.assignedTo === user?._id ? 'Assigned to you' : 
               item.assignedTo}
            </span>
          </div>
        </div>

        {/* Expanded Details - All Original Information */}
        {expanded && (
          <div className="space-y-3">
            {/* Product Information */}
            <div className="space-y-1">
              {item.productType && (
                <p className="text-xs text-muted-foreground">
                  Type: <span className="font-medium">{item.productType}</span>
                </p>
              )}
              {(item.productSize || item.productMaterial) && (
                <p className="text-xs text-muted-foreground">
                  {item.productSize && `Size: ${item.productSize}`}
                  {item.productSize && item.productMaterial && ' • '}
                  {item.productMaterial && `Material: ${item.productMaterial}`}
                </p>
              )}
            </div>

            {/* Current Stage Instructions */}
            <div className="bg-blue-50 p-2 rounded-md border border-blue-100">
              <div className="flex items-start gap-2">
                <Target className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-medium text-blue-900">What to do:</p>
                  <p className="text-xs text-blue-700">{getStageInstructions(item.currentStage)}</p>
                </div>
              </div>
            </div>

            {/* Priority Context */}
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">{getPriorityContext(item.priority)}</span>
            </div>

            {/* Special Instructions and Notes */}
            {(item.specialInstructions || item.stageNotes || item.orderNotes || item.textToPrint || item.itemDescription) && (
              <div className="bg-amber-50 p-2 rounded-md border border-amber-100">
                <div className="flex items-start gap-2">
                  <Info className="h-3 w-3 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-amber-900">Instructions & Notes:</p>
                    {item.stageNotes && (
                      <p className="text-xs text-amber-700 font-medium bg-amber-100 p-1 rounded">
                        <strong>🎯 Assignment Notes:</strong> {item.stageNotes}
                      </p>
                    )}
                    {item.specialInstructions && (
                      <p className="text-xs text-amber-700"><strong>Special:</strong> {item.specialInstructions}</p>
                    )}
                    {item.orderNotes && (
                      <p className="text-xs text-amber-700"><strong>Order:</strong> {item.orderNotes}</p>
                    )}
                    {item.textToPrint && (
                      <p className="text-xs text-amber-700"><strong>Text to Print:</strong> {item.textToPrint}</p>
                    )}
                    {item.itemDescription && (
                      <p className="text-xs text-amber-700"><strong>Item:</strong> {item.itemDescription}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Product Description */}
            {item.productDescription && (
              <div className="bg-gray-50 p-2 rounded-md border border-gray-100">
                <div className="flex items-start gap-2">
                  <FileText className="h-3 w-3 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-900">Product Details:</p>
                    <p className="text-xs text-gray-700">{item.productDescription}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Due Date */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span className={isTaskOverdue(item.dueDate) ? 'text-red-600 font-bold' : isTaskDueSoon(item.dueDate) ? 'text-orange-600 font-medium' : ''}>
                Due: {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'No due date'}
              </span>
              {isTaskOverdue(item.dueDate) && <span className="text-red-600 text-xs">⚠️ OVERDUE</span>}
              {isTaskDueSoon(item.dueDate) && !isTaskOverdue(item.dueDate) && <span className="text-orange-600 text-xs">⏰ DUE SOON</span>}
            </div>

            {/* Assignment Status */}
            <div className="flex items-center gap-1 text-xs">
              <User className="h-3 w-3" />
              <span className={item.isUnassigned ? 'text-orange-600 font-medium' : 'text-muted-foreground'}>
                {item.assignedTo === 'Not assigned to anyone' ? 'Available for pickup' : 
                 item.assignedTo === user?._id ? 'Assigned to you' : 
                 item.assignedTo}
              </span>
            </div>

            {/* Next Step Preview */}
            {item.nextStage && !item.disabledStages?.includes(item.nextStage) && (
              <div className="text-xs text-muted-foreground bg-green-50 p-2 rounded-md border border-green-100">
                <p className="font-medium text-green-900">Next: {item.nextStage.replace('_', ' ')}</p>
                <p className="text-green-700">{getStageInstructions(item.nextStage)}</p>
              </div>
            )}

            {/* Disabled Stages Info */}
            {item.disabledStages && item.disabledStages.length > 0 && (
              <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded-md border border-gray-100">
                <p className="font-medium text-gray-900">Skipped Stages:</p>
                <p className="text-gray-700">
                  {item.disabledStages.map(stage => stage.replace('_', ' ')).join(', ')} 
                  - These stages are not needed for this item
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-1 pt-2 border-t border-gray-100">
              {/* Show assignment button for unassigned items */}
              {item.isUnassigned && !isAdmin && (
                <Button 
                  size="sm" 
                  variant="default" 
                  className="text-xs h-7 w-full bg-blue-600 hover:bg-blue-700"
                  onClick={async () => {
                    try {
                      await handleSelfAssignment(item.itemId, item.orderId, item.currentStage)
                    } catch (error) {
                      console.error("Failed to assign task:", error)
                    }
                  }}
                >
                  🎯 Take This Task
                </Button>
              )}
              
              {/* Stage Update Dropdown */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Update Stage:</label>
                <StageUpdateSelect 
                  item={item} 
                  onStatusUpdate={onStatusUpdate}
                />
              </div>
              
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-xs h-6 w-full hover:bg-gray-100"
                onClick={() => router.push(`/orders/${item.orderId}`)}
              >
                📋 View Full Order
              </Button>
            </div>
          </div>
        )}

        {/* Always Visible Action Buttons (for collapsed state) */}
        {!expanded && (
          <div className="space-y-1 pt-1 border-t border-gray-100">
            {/* Show assignment button for unassigned items */}
            {item.isUnassigned && !isAdmin && (
              <Button 
                size="sm" 
                variant="default" 
                className="text-xs h-6 w-full bg-blue-600 hover:bg-blue-700"
                onClick={async () => {
                  try {
                    await handleSelfAssignment(item.itemId, item.orderId, item.currentStage)
                  } catch (error) {
                    console.error("Failed to assign task:", error)
                  }
                }}
              >
                🎯 Take
              </Button>
            )}
            
            {/* Stage Update Dropdown */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Stage:</label>
              <StageUpdateSelect 
                item={item} 
                onStatusUpdate={onStatusUpdate}
              />
            </div>
            
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-xs h-5 w-full hover:bg-gray-100"
              onClick={() => router.push(`/orders/${item.orderId}`)}
            >
              📋 View
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const isAdmin = user?.position === "admin"
  const [taskItems, setTaskItems] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // New state for improved UX
  const [showOnlyUrgent, setShowOnlyUrgent] = useState(false)
  const [expandedStages, setExpandedStages] = useState<Set<ItemStage>>(new Set(['TO_DO', 'GRAPHICS', 'PRINTING']))
  const [itemsPerStage, setItemsPerStage] = useState<Record<ItemStage, number>>({
    TO_DO: 5,
    GRAPHICS: 5,
    PRINTING: 5,
    CUTTING: 5,
    FINISHING: 5,
    PACKING: 5,
    DONE: 3,
    STANDBY: 3,
    CANCELLED: 2
  })

  const breadcrumbs = [{ label: "Dashboard" }]

  // Helper functions for stage management
  const toggleStageExpansion = (stage: ItemStage) => {
    const newExpanded = new Set(expandedStages)
    if (newExpanded.has(stage)) {
      newExpanded.delete(stage)
    } else {
      newExpanded.add(stage)
    }
    setExpandedStages(newExpanded)
  }

  const showMoreItems = (stage: ItemStage) => {
    setItemsPerStage(prev => ({
      ...prev,
      [stage]: prev[stage] + 5
    }))
  }

  const showLessItems = (stage: ItemStage) => {
    setItemsPerStage(prev => ({
      ...prev,
      [stage]: Math.max(3, prev[stage] - 5)
    }))
  }

  // Filter items based on current settings
  const getFilteredItems = (stageItems: TaskItem[]) => {
    if (showOnlyUrgent) {
      return stageItems.filter(item => 
        item.priority === 'URGENT' || 
        item.priority === 'HIGH' || 
        isTaskOverdue(item.dueDate) ||
        isTaskDueSoon(item.dueDate)
      )
    }
    return stageItems
  }

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
            
            // Extract additional product information
            const productInfo = item.product || {}
            const baseTaskData = {
              orderId: order._id,
              itemId: item._id,
              orderNumber: order.orderNumber || `Order ${order._id}`,
              productName: item.productNameSnapshot || productInfo.name || 'Unknown Product',
              quantity: item.quantity || 1,
              client: clientName,
              dueDate: order.dueDate || '',
              currentStage: currentStage,
              priority: order.priority || 'NORMAL',
              // Enhanced information
              productDescription: productInfo.description || item.descriptionSnapshot || '',
              specialInstructions: item.specialInstructions || order.specialInstructions || '',
              orderNotes: order.description || order.notes || '',
              clientNotes: order.customerNotes || '',
              productType: productInfo.type || productInfo.category || '',
              productSize: productInfo.size || item.size || '',
              productMaterial: productInfo.material || item.material || '',
              nextStage: getNextStage(currentStage),
              // Additional item-specific information
              textToPrint: item.textToPrint || '',
              disabledStages: item.disabledStages || [],
              itemDescription: item.descriptionSnapshot || ''
            }
            
            if (isAdmin) {
              // Admin sees all items, regardless of assignments
              // For admin, we'll show all assignment info for the current stage
              const currentAssignment = item.assignments?.find((assignment: any) => assignment.stage === currentStage)
              const assignedPersonName = currentAssignment?.assignedTo ? 
                `${currentAssignment.assignedTo.firstName || ''} ${currentAssignment.assignedTo.lastName || ''}`.trim() || 
                'Assigned' : 'Not assigned'
              
              tasks.push({
                ...baseTaskData,
                assignmentId: currentAssignment?._id || item._id, // Use assignment ID if available
                assignedTo: assignedPersonName,
                isUnassigned: !currentAssignment,
                stageNotes: currentAssignment?.stageNotes || currentAssignment?.notes || ''
              })
            } else {
              // For non-admin users, check assignments
              if (!item.assignments || !Array.isArray(item.assignments)) {
                // If no assignments exist, show item as unassigned and available for pickup
                tasks.push({
                  ...baseTaskData,
                  assignmentId: item._id, // Use item ID as fallback
                  assignedTo: 'Not assigned to anyone',
                  isUnassigned: true,
                  stageNotes: '' // No assignment = no assignment notes
                })
                continue
              }

              // Find the assignment for the current stage
              const currentAssignment = item.assignments.find((assignment: any) => assignment.stage === currentStage)
              
              // If no assignment for current stage, show as unassigned and available
              if (!currentAssignment) {
                tasks.push({
                  ...baseTaskData,
                  assignmentId: item._id, // Use item ID as fallback
                  assignedTo: 'Not assigned to anyone',
                  isUnassigned: true,
                  stageNotes: '' // No assignment for this stage = no assignment notes
                })
                continue
              }

              // Handle both object and string formats for assignedTo
              const assignedToId = typeof currentAssignment.assignedTo === 'object' && currentAssignment.assignedTo 
                ? currentAssignment.assignedTo._id 
                : currentAssignment.assignedTo

              // Only show items that are assigned to the current user
              if (assignedToId !== user?._id) continue

              // Debug log for assignment notes
              if (currentAssignment.stageNotes) {
                console.log('Assignment notes found:', {
                  orderId: order._id,
                  itemId: item._id,
                  stage: currentStage,
                  stageNotes: currentAssignment.stageNotes
                })
              }

              tasks.push({
                ...baseTaskData,
                assignmentId: currentAssignment._id,
                assignedTo: assignedToId,
                isUnassigned: false,
                stageNotes: currentAssignment.stageNotes || currentAssignment.notes || ''
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
                <CardTitle className="text-sm font-medium">My Active Tasks</CardTitle>
                <CheckCircle className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">{activeItems.length}</div>
                <p className="text-xs text-muted-foreground">{isAdmin ? 'All active items' : 'Your assignments + available tasks'}</p>
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
                      ? 'All items in the system with detailed instructions and requirements' 
                      : 'Your assigned tasks and available items with clear instructions for each stage. Everything you need to know without opening individual orders.'
                    }
                  </CardDescription>
                </div>
                
                {/* View Controls */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Urgent Only</span>
                    <Switch
                      checked={showOnlyUrgent}
                      onCheckedChange={setShowOnlyUrgent}
                    />
                    {showOnlyUrgent ? <Eye className="h-4 w-4 text-orange-500" /> : <EyeOff className="h-4 w-4" />}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mb-3 text-blue-600" />
                  <span className="text-sm font-medium">Loading your task board...</span>
                  <span className="text-xs text-muted-foreground mt-1">Gathering all the details you need</span>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-destructive">
                  <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
                  <p>{error}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4"
                     style={{ gridAutoRows: 'min-content' }}>
                  {stageColumns.map((stage) => {
                    const allStageItems = taskItems.filter((item) => item.currentStage === stage.key)
                    const filteredStageItems = getFilteredItems(allStageItems)
                    const isExpanded = expandedStages.has(stage.key)
                    const maxItems = itemsPerStage[stage.key]
                    const visibleItems = isExpanded ? filteredStageItems.slice(0, maxItems) : filteredStageItems.slice(0, 3)
                    const hasMore = filteredStageItems.length > visibleItems.length
                    const hiddenCount = filteredStageItems.length - visibleItems.length
                    
                    return (
                      <div key={stage.key} className="space-y-3">
                        {/* Stage Header */}
                        <div className={`p-3 rounded-lg ${stage.color} border border-gray-200`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-sm">{stage.label}</h3>
                              <p className="text-xs text-muted-foreground">
                                {showOnlyUrgent ? `${filteredStageItems.length} urgent` : `${allStageItems.length} total`}
                                {showOnlyUrgent && allStageItems.length !== filteredStageItems.length && 
                                  ` (${allStageItems.length - filteredStageItems.length} hidden)`
                                }
                              </p>
                              {filteredStageItems.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {getStageInstructions(stage.key)}
                                </p>
                              )}
                            </div>
                            
                            {/* Stage Controls */}
                            <div className="flex items-center gap-1">
                              {filteredStageItems.length > 3 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => toggleStageExpansion(stage.key)}
                                >
                                  {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Stage Items */}
                        <div className="space-y-2"
                             style={{ maxHeight: isExpanded ? 'none' : '60vh', overflowY: isExpanded ? 'visible' : 'auto' }}>
                          {visibleItems.map((item) => (
                            <ExpandableTaskCard
                              key={`${item.itemId}-${item.assignmentId}`}
                              item={item}
                              onStatusUpdate={handleStatusUpdate}
                              handleSelfAssignment={handleSelfAssignment}
                              user={user}
                              isAdmin={isAdmin}
                              router={router}
                            />
                          ))}
                          
                          {/* Show More/Less Controls */}
                          {filteredStageItems.length > 3 && (
                            <div className="flex flex-col gap-2 pt-2">
                              {hasMore && isExpanded && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-8"
                                  onClick={() => showMoreItems(stage.key)}
                                >
                                  Show More ({hiddenCount} remaining)
                                </Button>
                              )}
                              
                              {!hasMore && isExpanded && maxItems > 5 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-8"
                                  onClick={() => showLessItems(stage.key)}
                                >
                                  Show Less
                                </Button>
                              )}
                              
                              {!isExpanded && filteredStageItems.length > 3 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-8"
                                  onClick={() => toggleStageExpansion(stage.key)}
                                >
                                  Show All ({hiddenCount} more)
                                </Button>
                              )}
                            </div>
                          )}
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
