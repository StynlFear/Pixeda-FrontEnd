import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <Loader2 className="h-10 w-10 animate-spin text-[#1F3A5F]" />
    </div>
  )
}