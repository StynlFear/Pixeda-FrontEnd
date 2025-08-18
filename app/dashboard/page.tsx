"use client"

import { useAuth } from "@/lib/auth-context"
import { AppLayout } from "@/components/layout/app-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, AlertTriangle, CheckCircle, Package, Calendar, User } from "lucide-react"
import { PRIORITY_LABELS } from "@/lib/constants"

// Mock data for demonstration
const mockTaskItems = [
  {
    id: "1",
    orderNumber: "PX-20241211-0001",
    productName: "Wedding Invitation Premium",
    quantity: 50,
    client: "John & Sarah Smith",
    dueDate: "2024-12-15",
    currentStatus: "GRAPHICS",
    priority: "HIGH",
  },
  {
    id: "2",
    orderNumber: "PX-20241211-0002",
    productName: "Canvas Print Abstract",
    quantity: 1,
    client: "Maria Popescu",
    dueDate: "2024-12-13",
    currentStatus: "PRINTING",
    priority: "URGENT",
  },
  {
    id: "3",
    orderNumber: "PX-20241211-0003",
    productName: "Business Cards",
    quantity: 500,
    client: "Tech Solutions SRL",
    dueDate: "2024-12-16",
    currentStatus: "CUTTING",
    priority: "NORMAL",
  },
]

const stageColumns = [
  { key: "TO_DO", label: "To Do", color: "bg-gray-100" },
  { key: "GRAPHICS", label: "Graphics", color: "bg-blue-100" },
  { key: "PRINTING", label: "Printing", color: "bg-yellow-100" },
  { key: "CUTTING", label: "Cutting", color: "bg-orange-100" },
  { key: "FINISHING", label: "Finishing", color: "bg-purple-100" },
  { key: "PACKING", label: "Packing", color: "bg-green-100" },
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

export default function DashboardPage() {
  const { user } = useAuth()
  const isEmployee = user?.role === "EMPLOYEE"

  const breadcrumbs = [{ label: "Dashboard" }]

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
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">+2 from yesterday</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">3</div>
              <p className="text-xs text-muted-foreground">Needs immediate attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Urgent</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">5</div>
              <p className="text-xs text-muted-foreground">High priority items</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">8</div>
              <p className="text-xs text-muted-foreground">Great progress!</p>
            </CardContent>
          </Card>
        </div>

        {/* Task Board */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>My Task Board</CardTitle>
                <CardDescription>Items assigned to you organized by workflow stage</CardDescription>
              </div>
              <div className="flex gap-2">
                <Select defaultValue="all">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="due-soon">Due Soon</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="all">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {stageColumns.map((stage) => (
                <div key={stage.key} className="space-y-3">
                  <div className={`p-3 rounded-lg ${stage.color}`}>
                    <h3 className="font-medium text-sm">{stage.label}</h3>
                    <p className="text-xs text-muted-foreground">
                      {mockTaskItems.filter((item) => item.currentStatus === stage.key).length} items
                    </p>
                  </div>

                  <div className="space-y-2">
                    {mockTaskItems
                      .filter((item) => item.currentStatus === stage.key)
                      .map((item) => (
                        <Card key={item.id} className="p-3 hover:shadow-md transition-shadow cursor-pointer">
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
                              <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                            </div>

                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span className="truncate">{item.client}</span>
                            </div>

                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{item.dueDate}</span>
                            </div>

                            <div className="flex gap-1 pt-2">
                              <Button size="sm" variant="outline" className="text-xs h-6 bg-transparent">
                                Update Status
                              </Button>
                              <Button size="sm" variant="ghost" className="text-xs h-6">
                                View Order
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
    </ProtectedRoute>
  )
}
