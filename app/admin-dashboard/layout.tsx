import { ProtectedRoute } from "@/components/protected-route"
import { AppLayout } from "@/components/layout/app-layout"

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute requiredRole="admin">
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  )
}
