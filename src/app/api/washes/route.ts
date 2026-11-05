import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import WashEntry from "@/models/WashEntry";

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date"); // YYYY-MM-DD
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const paymentMode = searchParams.get("paymentMode");
    const paymentStatus = searchParams.get("paymentStatus");
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    const query: any = {};

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: startOfDay, $lte: endOfDay };
    }

    if (category && category !== "All") {
      query.category = category;
    }

    if (paymentMode && paymentMode !== "All") {
      query.paymentMode = paymentMode;
    }

    if (paymentStatus && paymentStatus !== "All") {
      query.paymentStatus = paymentStatus;
    }

    if (search) {
      query.$or = [
        { vehicleNumber: { $regex: search, $options: "i" } },
        { customerPhone: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { make: { $regex: search, $options: "i" } },
        { model: { $regex: search, $options: "i" } },
      ];
    }

    const entries = await (WashEntry as any).find(query).sort({ createdAt: -1 }).limit(limit).lean();

    // Summary calculations
    const allMatches = await (WashEntry as any).find(query).lean();
    const totalAmount = allMatches.reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);
    const upiAmount = allMatches.filter((e: any) => e.paymentMode?.includes("UPI")).reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);
    const cashAmount = allMatches.filter((e: any) => e.paymentMode === "Cash").reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);
    const pendingAmount = allMatches.filter((e: any) => e.paymentMode === "Pending" || e.paymentStatus === "Pending").reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);
    const pendingCount = allMatches.filter((e: any) => e.paymentMode === "Pending" || e.paymentStatus === "Pending").length;
    const count = allMatches.length;

    return NextResponse.json({
      success: true,
      entries,
      stats: {
        totalAmount,
        upiAmount,
        cashAmount,
        pendingAmount,
        pendingCount,
        count
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    const {
      vehicleNumber,
      customerName,
      customerPhone,
      make,
      model,
      category,
      serviceType,
      amount,
      paymentMode,
      paymentStatus,
      parivahanDetails,
      notes,
      status
    } = body;

    if (!vehicleNumber || !customerPhone || amount === undefined) {
      return NextResponse.json(
        { success: false, error: "Vehicle number, customer phone and amount are required" },
        { status: 400 }
      );
    }

    const newEntry = await (WashEntry as any).create({
      vehicleNumber: vehicleNumber.toUpperCase().trim(),
      customerName: customerName || "",
      customerPhone: customerPhone.trim(),
      make: make || "",
      model: model || "",
      category: category || "Hatchback (5 Seater)",
      serviceType: serviceType || "Basic Wash",
      amount: Number(amount),
      paymentMode: paymentMode || "UPI / QR",
      paymentStatus: paymentStatus || (paymentMode === "Pending" ? "Pending" : "Paid"),
      parivahanDetails,
      notes: notes || "",
      status: status || "Completed"
    });

    return NextResponse.json({ success: true, entry: newEntry });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { id, paymentStatus, paymentMode } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Entry ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
    if (paymentMode !== undefined) updateData.paymentMode = paymentMode;

    const updatedEntry = await (WashEntry as any).findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!updatedEntry) {
      return NextResponse.json({ success: false, error: "Entry not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, entry: updatedEntry });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });
    }

    await (WashEntry as any).findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Entry deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
