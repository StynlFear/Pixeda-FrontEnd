"use client"

import { useAuth } from "@/lib/auth-context"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { LayoutDashboard, Users, UserCheck, Package, ShoppingCart, Settings, LogOut, BriefcaseBusiness } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "EMPLOYEE"],
  },
  {
    title: "Companies",
    url: "/companies",
    icon: BriefcaseBusiness,
    roles: ["ADMIN", "EMPLOYEE"],
  },
  {
    title: "Clients",
    url: "/clients",
    icon: Users,
    roles: ["ADMIN", "EMPLOYEE"],
  },
  {
    title: "Employees",
    url: "/employees",
    icon: UserCheck,
    roles: ["ADMIN"],
  },
  {
    title: "Products",
    url: "/products",
    icon: Package,
    roles: ["ADMIN", "EMPLOYEE"],
  },
  {
    title: "Orders",
    url: "/orders",
    icon: ShoppingCart,
    roles: ["ADMIN", "EMPLOYEE"],
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    roles: ["ADMIN"],
  },
]

export function AppSidebar() {
  const { user, logout } = useAuth()
  const userRole = user?.role

  const filteredMenuItems = menuItems.filter((item) => item.roles.includes(userRole as string))

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-border">
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <span className="text-sm font-bold text-primary-foreground">PX</span>
          </div>
          <div>
            <h2 className="font-semibold text-primary">Pixeda</h2>
            <p className="text-xs text-muted-foreground">Management System</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border">
        <div className="p-4">
          <div className="mb-3">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
            <p className="text-xs text-accent font-medium">{user?.role}</p>
          </div>
          <Button variant="outline" size="sm" className="w-full bg-transparent" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
