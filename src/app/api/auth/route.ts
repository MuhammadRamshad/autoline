import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import AdminUser from "@/models/AdminUser";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const inputUser = (body.username || "").trim();
    const inputPass = (body.password || "").trim();

    if (!inputUser || !inputPass) {
      return NextResponse.json(
        { success: false, error: "Username and password are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // 1. Check if the admin collection has any users; if empty, seed default admin from env/fallback
    const count = await AdminUser.countDocuments();
    if (count === 0) {
      const defaultUsername = (process.env.ADMIN_USERNAME || "admin").trim().toLowerCase();
      const defaultPassword = (process.env.ADMIN_PASSWORD || "admin").trim();
      await AdminUser.create({
        username: defaultUsername,
        password: defaultPassword,
        name: "Super Admin",
        role: "superadmin",
        active: true,
      });
    }

    // 2. Query user from MongoDB database
    const user = await AdminUser.findOne({
      username: inputUser.toLowerCase(),
      active: true,
    });

    let isValid = false;

    if (user && user.password === inputPass) {
      isValid = true;
    } else {
      // Fallback check against environment variables in case of emergency
      const envUser = (process.env.ADMIN_USERNAME || "admin").trim().toLowerCase();
      const envPass = (process.env.ADMIN_PASSWORD || "admin").trim();
      if (inputUser.toLowerCase() === envUser && inputPass === envPass) {
        isValid = true;
      }
    }

    if (isValid) {
      const response = NextResponse.json({
        success: true,
        message: "Authentication successful",
        user: { username: user?.username || inputUser, name: user?.name || "Admin" },
      });

      // Set session cookie
      response.cookies.set({
        name: "admin_session",
        value: "authenticated_autoline_superadmin",
        path: "/",
        httpOnly: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
    }

    return NextResponse.json(
      { success: false, error: "Invalid username or password" },
      { status: 401 }
    );
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
