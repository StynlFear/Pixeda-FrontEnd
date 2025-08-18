"use client"
import * as React5 from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Button as Button4 } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronsUpDown, Plus, Building2, User } from "lucide-react"
import { cn } from "@/lib/utils"
import api from "@/lib/axios"

type Company = {
  _id: string;
  name: string;
  cui?: string;
  defaultFolderPath?: string;
  description?: string;
};

type Client = {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  defaultFolderPath?: string;
  companies?: Company[];
  companyIds?: string[];
};

type ClientSelection = {
  clientId: string;
  companyId?: string; // undefined for physical person
  displayName: string;
  isPhysicalPerson: boolean;
};

export default function ClientAutocomplete({ 
  value, 
  onChange 
}: { 
  value?: string; 
  onChange: (selection: ClientSelection) => void 
}) {
  const [open, setOpen] = React5.useState(false)
  const [query, setQuery] = React5.useState("")
  const [items, setItems] = React5.useState<Client[]>([])
  const [selectedClient, setSelectedClient] = React5.useState<Client | null>(null)
  const [showCompanySelection, setShowCompanySelection] = React5.useState(false)

  React5.useEffect(() => {
    const c = new AbortController()
    async function load() {
      try {
        const res = await api.get("/api/clients", { params: { q: query, limit: 10 }, signal: c.signal })
        const raw = (res.data?.data ?? res.data?.clients ?? res.data?.items ?? [])
        setItems(raw)
      } catch (error) {
        if (!c.signal.aborted) {
          setItems([])
        }
      }
    }
    load(); return () => c.abort()
  }, [query])

  // Parse the current value to show display text
  const getCurrentDisplayText = () => {
    if (!value) return "Select client"
    
    try {
      const parsed = JSON.parse(value) as ClientSelection
      return (
        <div className="flex items-center gap-2 w-full">
          <span className="flex-1 text-left">{parsed.displayName}</span>
          {parsed.isPhysicalPerson ? (
            <User className="h-3 w-3 text-muted-foreground" />
          ) : (
            <Building2 className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
      )
    } catch {
      // Fallback for old format
      const client = items.find((c) => c._id === value)
      if (client) {
        return `${client.firstName} ${client.lastName}`
      }
      return value
    }
  }

  const handleClientSelect = (client: Client) => {
    // Check if client has companies
    const hasCompanies = client.companies && client.companies.length > 0
    
    if (!hasCompanies) {
      // No companies, select as physical person
      const selection: ClientSelection = {
        clientId: client._id,
        companyId: undefined,
        displayName: `${client.firstName} ${client.lastName} (Physical Person)`,
        isPhysicalPerson: true
      }
      onChange(selection)
      setOpen(false)
    } else {
      // Has companies, show company selection
      setSelectedClient(client)
      setShowCompanySelection(true)
    }
  }

  const handleCompanySelect = (companyId?: string) => {
    if (!selectedClient) return
    
    const company = selectedClient.companies?.find(c => c._id === companyId)
    const selection: ClientSelection = {
      clientId: selectedClient._id,
      companyId,
      displayName: companyId ? 
        `${selectedClient.firstName} ${selectedClient.lastName} (${company?.name})` :
        `${selectedClient.firstName} ${selectedClient.lastName} (Physical Person)`,
      isPhysicalPerson: !companyId
    }
    
    onChange(selection)
    setOpen(false)
    setShowCompanySelection(false)
    setSelectedClient(null)
  }

  const handleBackToClients = () => {
    setShowCompanySelection(false)
    setSelectedClient(null)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button4 variant="outline" role="combobox" className="w-full justify-between">
          {getCurrentDisplayText()}
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button4>
      </PopoverTrigger>
      <PopoverContent className="w-[450px] p-0">
        <Command>
          {!showCompanySelection ? (
            <>
              <CommandInput placeholder="Search clients…" value={query} onValueChange={setQuery} />
              <CommandEmpty>No clients found.</CommandEmpty>
              <CommandGroup>
                {items.map((client) => {
                  const hasCompanies = client.companies && client.companies.length > 0
                  return (
                    <CommandItem 
                      key={client._id} 
                      onSelect={() => handleClientSelect(client)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {client.firstName} {client.lastName}
                          </div>
                          {client.email && (
                            <div className="text-sm text-muted-foreground">{client.email}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {hasCompanies && (
                          <Badge variant="secondary" className="text-xs">
                            {client.companies!.length} {client.companies!.length === 1 ? 'company' : 'companies'}
                          </Badge>
                        )}
                        {!hasCompanies && (
                          <Badge variant="outline" className="text-xs">
                            Physical Person
                          </Badge>
                        )}
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between p-3 border-b">
                <div className="font-medium">
                  Select company for {selectedClient?.firstName} {selectedClient?.lastName}
                </div>
                <Button4 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleBackToClients}
                  className="text-xs"
                >
                  ← Back
                </Button4>
              </div>
              <CommandGroup>
                {/* Physical Person Option */}
                <CommandItem onSelect={() => handleCompanySelect(undefined)}>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Physical Person</div>
                      <div className="text-sm text-muted-foreground">Individual client</div>
                    </div>
                  </div>
                </CommandItem>
                
                {/* Company Options */}
                {selectedClient?.companies?.map((company) => (
                  <CommandItem 
                    key={company._id} 
                    onSelect={() => handleCompanySelect(company._id)}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{company.name}</div>
                        {company.cui && (
                          <div className="text-sm text-muted-foreground">CUI: {company.cui}</div>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export type { ClientSelection }