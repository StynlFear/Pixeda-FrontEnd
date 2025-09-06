"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UserCheck, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ItemStage = "TO_DO" | "GRAPHICS" | "PRINTING" | "CUTTING" | "FINISHING" | "PACKING" | "DONE" | "STANDBY" | "CANCELLED"

type DashboardItem = {
  orderNumber?: string
  productName?: string
  quantity?: number
  productMaterial?: string
  client?: string
  orderedBy?: string
  created?: string
  dueDate?: string
  currentStage?: string
  assignedTo?: string
  customerCompany?: {
    name: string
    cui: string
  }
  orderId?: string
  itemId?: string
  isUnassigned?: boolean
}

export default function DashboardTable({ 
  items, 
  onSelfAssign 
}: { 
  items?: DashboardItem[]
  onSelfAssign?: (itemId: string, orderId: string, stage: ItemStage) => Promise<void>
}) {
  console.log('Dashboard items:', items);
  const router = useRouter();
  const { toast } = useToast();
  const [assigningItems, setAssigningItems] = useState<Set<string>>(new Set());
  const rows = items && items.length > 0 ? items : []

  const handleRowClick = (orderId: string | undefined) => {
    if (orderId) {
      router.push(`/orders/${orderId}`);
    }
  };

  const handleSelfAssign = async (e: React.MouseEvent, itemId: string, orderId: string, stage: string) => {
    e.stopPropagation(); // Prevent row click navigation
    
    if (!onSelfAssign || !itemId || !orderId || !stage) return;
    
    const assignmentKey = `${itemId}-${orderId}`;
    if (assigningItems.has(assignmentKey)) return; // Prevent double assignment
    
    setAssigningItems(prev => new Set(prev).add(assignmentKey));
    
    try {
      await onSelfAssign(itemId, orderId, stage as ItemStage);
      toast({
        title: "Task assigned",
        description: "The task has been assigned to you successfully.",
      });
    } catch (error) {
      console.error('Failed to assign task:', error);
      toast({
        title: "Assignment failed",
        description: "Failed to assign the task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAssigningItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(assignmentKey);
        return newSet;
      });
    }
  };

  return (
    <div className="overflow-auto bg-card rounded shadow-sm p-4">
      <h2 className="mb-4 text-lg font-medium text-muted-foreground">Filter by:</h2>

      <table className="w-full border-collapse table-fixed text-sm">
        <thead>
          <tr className="bg-muted-foreground/5 dark:bg-muted-foreground/10">
            <th className="border border-border p-2 text-left text-muted-foreground">Product name</th>
            <th className="border border-border p-2 text-left text-muted-foreground">Qty</th>
            <th className="border border-border p-2 text-left text-muted-foreground">Material</th>
            <th className="border border-border p-2 text-left text-muted-foreground">Order number</th>
            <th className="border border-border p-2 text-left text-muted-foreground">Client</th>
            <th className="border border-border p-2 text-left text-muted-foreground">Ordered by</th>
            <th className="border border-border p-2 text-left text-muted-foreground">Created</th>
            <th className="border border-border p-2 text-left text-muted-foreground">Due</th>
            <th className="border border-border p-2 text-left text-muted-foreground">Status</th>
            <th className="border border-border p-2 text-left text-muted-foreground">Taken by</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="border p-2 text-center" colSpan={10}>
                No items to show
              </td>
            </tr>
          ) : (
            rows.map((r, idx) => (
              <tr 
                key={`${r.orderNumber ?? 'order'}-${idx}`}
                className="hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => handleRowClick(r.orderId)}
              >
                  <td className="border border-border p-2 text-muted-foreground">{r.productName ?? '-'}</td>
                  <td className="border border-border p-2 text-muted-foreground">{r.quantity ?? '-'}</td>
                  <td className="border border-border p-2 text-muted-foreground">{r.productMaterial ?? '-'}</td>
                  <td className="border border-border p-2 text-muted-foreground break-words max-w-[200px]">{r.orderNumber ?? '-'}</td>
                  <td className="border border-border p-2 text-muted-foreground">
                    <div>
                      <div>{r.client ?? '-'}</div>
                      {r.customerCompany && (
                        <div className="text-xs text-muted-foreground">CUI: {r.customerCompany.cui}</div>
                      )}
                    </div>
                  </td>
                  <td className="border border-border p-2 text-muted-foreground">{r.orderedBy ?? '-'}</td>
                  <td className="border border-border p-2 text-muted-foreground">{r.created ?? '-'}</td>
                  <td className="border border-border p-2 text-muted-foreground">{r.dueDate ?? '-'}</td>
                  <td className="border border-border p-2 text-muted-foreground">{r.currentStage ?? '-'}</td>
                  <td className="border border-border p-2 text-muted-foreground">
                    <div className="flex flex-col gap-1">
                      <span>{r.assignedTo ?? '-'}</span>
                      {(r.isUnassigned || r.assignedTo === 'Not assigned' || r.assignedTo === 'Not assigned to anyone') && r.itemId && r.orderId && r.currentStage && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs w-fit"
                          onClick={(e) => handleSelfAssign(e, r.itemId!, r.orderId!, r.currentStage!)}
                          disabled={assigningItems.has(`${r.itemId}-${r.orderId}`)}
                        >
                          {assigningItems.has(`${r.itemId}-${r.orderId}`) ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Assigning...
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-3 w-3 mr-1" />
                              Assign to me
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
