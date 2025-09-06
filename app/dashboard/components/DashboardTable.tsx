"use client";
import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UserCheck, Loader2 } from "lucide-react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
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
  assignmentId?: string
}

export default function DashboardTable({ 
  items, 
  onSelfAssign,
  onStatusUpdate,
  onRefresh
}: { 
  items?: DashboardItem[]
  onSelfAssign?: (itemId: string, orderId: string, stage: ItemStage) => Promise<void>
  onStatusUpdate?: (itemId: string, assignmentId: string, newStage: ItemStage) => Promise<void>
  onRefresh?: () => Promise<void> | void
}) {
  console.log('Dashboard items:', items);
  const router = useRouter();
  const { toast } = useToast();
  const [assigningItems, setAssigningItems] = useState<Set<string>>(new Set());
  const [updatingStatus, setUpdatingStatus] = useState<Set<string>>(new Set());
  // Filtering state
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<ItemStage | 'ALL'>('ALL');
  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const activeItems = useMemo(() => (items && items.length > 0
    ? items.filter(i => !['DONE','STANDBY','CANCELLED'].includes(i.currentStage || ''))
    : []), [items]);

  const filtered = useMemo(() => {
    let r = activeItems;
    if (stageFilter !== 'ALL') {
      r = r.filter(i => i.currentStage === stageFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(i => (
        (i.productName || '').toLowerCase().includes(q) ||
        (i.orderNumber || '').toLowerCase().includes(q) ||
        (i.client || '').toLowerCase().includes(q)
      ));
    }
    return r;
  }, [activeItems, stageFilter, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pagedRows = useMemo(() => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize), [filtered, currentPage, pageSize]);

  const rows = pagedRows;

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
      if (onRefresh) {
        await Promise.resolve(onRefresh());
      }
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
    <div className="overflow-auto bg-card rounded shadow-sm p-4 space-y-4">
      <div className="flex flex-col md:flex-row gap-3 md:items-end md:justify-between">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:gap-4 w-full">
          <div className="flex flex-col gap-1 w-full md:max-w-xs">
            <label className="text-xs font-medium text-muted-foreground">Search</label>
            <input
              className="h-9 rounded-md border border-border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Product, order #, client..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex flex-col gap-1 w-full md:max-w-[160px]">
            <label className="text-xs font-medium text-muted-foreground">Stage</label>
            <select
              className="h-9 rounded-md border border-border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={stageFilter}
              onChange={e => { setStageFilter(e.target.value as any); setPage(1); }}
            >
              <option value="ALL">All Active</option>
              {['TO_DO','GRAPHICS','PRINTING','CUTTING','FINISHING','PACKING'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1 w-full md:max-w-[120px]">
            <label className="text-xs font-medium text-muted-foreground">Page Size</label>
            <select
              className="h-9 rounded-md border border-border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
            >
              {[10,15,25,50].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-xs text-muted-foreground">{filtered.length} items</span>
        </div>
      </div>

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
                  <td className="border border-border p-2 text-muted-foreground">
                    <div className="flex flex-col gap-1" onClick={(e)=>e.stopPropagation()}>
                      <span className="text-xs font-medium tracking-wide">{r.currentStage ?? '-'}</span>
                      {onStatusUpdate && r.itemId && r.assignmentId && (
                        <Select
                          value={r.currentStage}
                          onValueChange={async (val) => {
                            if (!r.itemId || !r.assignmentId) return;
                            const key = `${r.itemId}-${r.assignmentId}`;
                            if (updatingStatus.has(key)) return;
                            setUpdatingStatus(prev => new Set(prev).add(key));
                            try {
                              await onStatusUpdate(r.itemId, r.assignmentId, val as ItemStage);
                              toast({ title: 'Status updated', description: `Item moved to ${val}` });
                              if (onRefresh) {
                                await Promise.resolve(onRefresh());
                              }
                            } catch (err) {
                              console.error('Failed to update status', err);
                              toast({ title: 'Update failed', description: 'Could not change status', variant: 'destructive' });
                            } finally {
                              setUpdatingStatus(prev => { const ns = new Set(prev); ns.delete(key); return ns; });
                            }
                          }}
                        >
                          <SelectTrigger className="h-7 w-full text-xs">
                            <SelectValue placeholder="Change" />
                          </SelectTrigger>
                          <SelectContent>
                            {['TO_DO','GRAPHICS','PRINTING','CUTTING','FINISHING','PACKING','DONE','STANDBY','CANCELLED'].map(stage => (
                              <SelectItem key={stage} value={stage} disabled={updatingStatus.has(`${r.itemId}-${r.assignmentId}`)}>
                                {stage}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </td>
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
      {/* Pagination controls */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mt-4">
        <div className="text-xs text-muted-foreground">Page {currentPage} of {pageCount}</div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={currentPage === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >Prev</Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={currentPage === pageCount}
            onClick={() => setPage(p => Math.min(pageCount, p + 1))}
          >Next</Button>
        </div>
      </div>
    </div>
  );
}
