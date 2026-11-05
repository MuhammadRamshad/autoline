import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = (body.username || "").trim();
    const password = (body.password || "").trim();

    const envUser = (process.env.ADMIN_USERNAME || "admin").trim();
    const envPass = (process.env.ADMIN_PASSWORD || "admin").trim();

    if (username === envUser && password === envPass) {
      const response = NextResponse.json({ success: true, message: "Authentication successful" });
      
      // Set session cookie directly on response object with cross-device lax settings
      response.cookies.set({
        name: "admin_session",
        value: "authenticated_autoline_superadmin",
        path: "/",
        httpOnly: false, // Accessible to client so client can verify or navigate
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
      });

      return response;
    }

    return NextResponse.json({ success: false, error: "Invalid username or password" }, { status: 401 });
  } catch (error: any) {
    console.error("Auth error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: "Logged out" });
  response.cookies.set({
    name: "admin_session",
    value: "",
    path: "/",
    maxAge: 0,
  });
  return response;
}
