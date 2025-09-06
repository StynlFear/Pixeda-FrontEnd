"use client";
import React from "react";

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
}

export default function DashboardTable({ items }: { items?: DashboardItem[] }) {
  console.log('Dashboard items:', items);
  const rows = items && items.length > 0 ? items : []

  return (
    <div className="overflow-auto bg-card rounded shadow-sm p-4">
      <h2 className="mb-4 text-lg font-medium text-muted-foreground">Flylter by:</h2>

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
              <tr key={`${r.orderNumber ?? 'order'}-${idx}`}>
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
                  <td className="border border-border p-2 text-muted-foreground">{r.assignedTo ?? '-'}</td>
                </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
