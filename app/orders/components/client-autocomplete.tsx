"use client"
import * as React5 from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Button as Button4 } from "@/components/ui/button"
import { ChevronsUpDown, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import api from "@/lib/axios"

export default function ClientAutocomplete({ value, onChange }: { value?: string; onChange: (id: string) => void }) {
  const [open, setOpen] = React5.useState(false)
  const [query, setQuery] = React5.useState("")
  const [items, setItems] = React5.useState<any[]>([])
  React5.useEffect(() => {
    const c = new AbortController()
    async function load() {
      const res = await api.get("/api/clients", { params: { q: query, limit: 10 }, signal: c.signal })
      const raw = (res.data?.data ?? res.data?.clients ?? res.data?.items ?? [])
      setItems(raw)
    }
    load(); return () => c.abort()
  }, [query])

  const cur = items.find((c) => c._id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button4 variant="outline" role="combobox" className="w-full justify-between">
          {cur ? (cur.companyName || `${cur.lastName ?? ''} ${cur.firstName ?? ''}`) : (value ? value : "Select client")}
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button4>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0">
        <Command>
          <CommandInput placeholder="Search clients…" value={query} onValueChange={setQuery} />
          <CommandEmpty>No clients. Create one below.</CommandEmpty>
          <CommandGroup>
            {items.map((c) => (
              <CommandItem key={c._id} onSelect={() => { onChange(c._id); setOpen(false) }}>
                {c.companyName || `${c.lastName ?? ''} ${c.firstName ?? ''}`} {c.email ? `• ${c.email}` : ''}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function CreateClientButton({ onCreated }: { onCreated: (id: string) => void }) {
  return (
    <Button4 type="button" variant="outline" className="mt-2 inline-flex items-center gap-2" onClick={async () => {
      const firstName = prompt("First name") || ""
      const lastName = prompt("Last name") || ""
      const email = prompt("Email (optional)") || undefined
      const res = await api.post("/api/clients", { firstName, lastName, email })
      onCreated(res.data?._id)
    }}>
      <Plus className="h-4 w-4"/> New client
    </Button4>
  )
}