import { type NextRequest, NextResponse } from "next/server"

// Mock clients data - replace with database later
const mockClients = [
  {
    _id: "1",
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@email.com",
    companyName: "Smith Photography",
    companyCode: "SP001",
    phone: "+40 123 456 789",
    folderPath: "/clients/smith-photography",
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
  },
  {
    _id: "2",
    firstName: "Maria",
    lastName: "Popescu",
    email: "maria.popescu@gmail.com",
    companyName: "",
    companyCode: "",
    phone: "+40 987 654 321",
    folderPath: "/clients/maria-popescu",
    createdAt: "2024-02-10T14:20:00Z",
    updatedAt: "2024-02-10T14:20:00Z",
  },
  {
    _id: "3",
    firstName: "Alexandru",
    lastName: "Ionescu",
    email: "alex@techsolutions.ro",
    companyName: "Tech Solutions SRL",
    companyCode: "TS2024",
    phone: "+40 555 123 456",
    folderPath: "/clients/tech-solutions",
    createdAt: "2024-03-05T09:15:00Z",
    updatedAt: "2024-03-05T09:15:00Z",
  },
  {
    _id: "4",
    firstName: "Elena",
    lastName: "Georgescu",
    email: "elena.georgescu@yahoo.com",
    companyName: "",
    companyCode: "",
    phone: "+40 777 888 999",
    folderPath: "/clients/elena-georgescu",
    createdAt: "2024-03-12T16:45:00Z",
    updatedAt: "2024-03-12T16:45:00Z",
  },
  {
    _id: "5",
    firstName: "Mihai",
    lastName: "Radu",
    email: "mihai@creativestudio.ro",
    companyName: "Creative Studio",
    companyCode: "CS001",
    phone: "+40 333 222 111",
    folderPath: "/clients/creative-studio",
    createdAt: "2024-03-20T11:30:00Z",
    updatedAt: "2024-03-20T11:30:00Z",
  },
]

function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization")
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7)
  }
  return null
}

function isValidToken(token: string): boolean {
  // Simple token validation - replace with your JWT validation
  return token.startsWith("mock-token-")
}

export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request)
    if (!token || !isValidToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const sort = searchParams.get("sort") || "lastName"

    let filteredClients = [...mockClients]

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase()
      filteredClients = filteredClients.filter(
        (client) =>
          client.firstName.toLowerCase().includes(searchLower) ||
          client.lastName.toLowerCase().includes(searchLower) ||
          client.email?.toLowerCase().includes(searchLower) ||
          client.companyName?.toLowerCase().includes(searchLower) ||
          client.phone?.includes(search),
      )
    }

    // Apply sorting
    filteredClients.sort((a, b) => {
      const aValue = a[sort as keyof typeof a] || ""
      const bValue = b[sort as keyof typeof b] || ""
      return aValue.toString().localeCompare(bValue.toString())
    })

    // Apply pagination
    const total = filteredClients.length
    const skip = (page - 1) * limit
    const paginatedClients = filteredClients.slice(skip, skip + limit)
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      data: paginatedClients,
      page,
      limit,
      total,
      totalPages,
    })
  } catch (error) {
    console.error("Error fetching clients:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getAuthToken(request)
    if (!token || !isValidToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Create new client with mock ID
    const newClient = {
      _id: (mockClients.length + 1).toString(),
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // In a real app, this would save to database
    mockClients.push(newClient)

    return NextResponse.json(newClient, { status: 201 })
  } catch (error) {
    console.error("Error creating client:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
