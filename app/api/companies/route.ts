import { NextRequest, NextResponse } from "next/server";

// This would typically connect to your backend API
// For now, I'll create a mock structure that matches your backend routes

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "10";
    const sort = searchParams.get("sort") || "-createdAt";

    // Build query parameters for backend
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("page", page);
    params.set("limit", limit);
    params.set("sort", sort);

    const response = await fetch(`${API_BASE_URL}/api/companies?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Add authorization headers if needed
        // "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/api/companies`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add authorization headers if needed
        // "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating company:", error);
    return NextResponse.json(
      { error: "Failed to create company" },
      { status: 500 }
    );
  }
}
