"use client"
import * as React6 from "react"
import { Popover as Popover2, PopoverContent as PopoverContent2, PopoverTrigger as PopoverTrigger2 } from "@/components/ui/popover"
import { Command as Command2, CommandEmpty as CommandEmpty2, CommandGroup as CommandGroup2, CommandInput as CommandInput2, CommandItem as CommandItem2 } from "@/components/ui/command"
import { Button as Button5 } from "@/components/ui/button"
import { ChevronsUpDown as ChevronsUpDown2, Plus as Plus2 } from "lucide-react"
import api from "@/lib/axios"

export default function ProductPicker({ onPick }: { onPick: (product: any) => void }) {
  const [open, setOpen] = React6.useState(false)
  const [query, setQuery] = React6.useState("")
  const [items, setItems] = React6.useState<any[]>([])

  React6.useEffect(() => {
    const c = new AbortController()
    async function load() {
      const res = await api.get("/api/products", { params: { q: query, limit: 10 }, signal: c.signal })
      setItems(res.data?.data ?? res.data?.products ?? res.data?.items ?? [])
    }
    load(); return () => c.abort()
  }, [query])

  return (
    <Popover2 open={open} onOpenChange={setOpen}>
      <PopoverTrigger2 asChild>
        <Button5 type="button" variant="outline" className="justify-between w-full">
          Add product…
          <ChevronsUpDown2 className="ml-2 h-4 w-4 opacity-50" />
        </Button5>
      </PopoverTrigger2>
      <PopoverContent2 className="w-[520px] p-0">
        <Command2>
          <CommandInput2 placeholder="Search by name or code…" value={query} onValueChange={setQuery} />
          <CommandEmpty2>No products</CommandEmpty2>
          <CommandGroup2>
            {items.map((p) => (
              <CommandItem2 key={p._id} onSelect={() => { onPick(p); setOpen(false) }}>
                <div>
                  <div className="font-medium">{p.productName} <span className="text-muted-foreground font-normal">({p.productCode})</span></div>
                  <div className="text-xs text-muted-foreground">{typeof p.price === 'number' ? `${p.price} RON` : '-'} • {p.type || '-'}</div>
                </div>
              </CommandItem2>
            ))}
          </CommandGroup2>
        </Command2>
      </PopoverContent2>
    </Popover2>
  )
}