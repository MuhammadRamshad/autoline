import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import WashEntry from "@/models/WashEntry";

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date"); // Legacy single date YYYY-MM-DD
    const fromDate = searchParams.get("fromDate"); // YYYY-MM-DD
    const toDate = searchParams.get("toDate"); // YYYY-MM-DD
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const paymentMode = searchParams.get("paymentMode");
    const paymentStatus = searchParams.get("paymentStatus");
    const limit = parseInt(searchParams.get("limit") || "500", 10);

    const query: any = {};

    // Date range filtering (From Date - To Date) or single date
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) {
        const start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);
        query.createdAt.$gte = start;
      }
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    } else if (date) {
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
      if (paymentMode === "Pending") {
        query.$or = [{ paymentMode: "Pending" }, { paymentStatus: "Pending" }];
      } else {
        query.paymentMode = paymentMode;
      }
    }

    if (paymentStatus && paymentStatus !== "All") {
      if (paymentStatus === "Pending") {
        query.$or = [{ paymentMode: "Pending" }, { paymentStatus: "Pending" }];
      } else if (paymentStatus === "Paid") {
        query.paymentStatus = "Paid";
        query.paymentMode = { $ne: "Pending" };
      }
    }

    if (search && search.trim()) {
      const cleanSearch = search.trim();
      const searchConditions = [
        { vehicleNumber: { $regex: cleanSearch, $options: "i" } },
        { customerPhone: { $regex: cleanSearch, $options: "i" } },
        { customerName: { $regex: cleanSearch, $options: "i" } },
        { make: { $regex: cleanSearch, $options: "i" } },
        { model: { $regex: cleanSearch, $options: "i" } },
        { notes: { $regex: cleanSearch, $options: "i" } },
      ];

      if (query.$or) {
        // If query already has an $or condition (e.g. from Pending), combine with $and
        query.$and = [{ $or: query.$or }, { $or: searchConditions }];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
    }

    const entries = await (WashEntry as any).find(query).sort({ createdAt: -1 }).limit(limit).lean();

    // Summary calculations
    const allMatches = await (WashEntry as any).find(query).lean();
    const totalAmount = allMatches.reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);
    const upiAmount = allMatches.filter((e: any) => e.paymentMode?.includes("UPI")).reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);
    const cashAmount = allMatches.filter((e: any) => e.paymentMode === "Cash").reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);
    const pendingAmount = allMatches.filter((e: any) => e.paymentMode === "Pending" || e.paymentStatus === "Pending").reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);
    const pendingCount = allMatches.filter((e: any) => e.paymentMode === "Pending" || e.paymentStatus === "Pending").length;
    const paidCount = allMatches.length - pendingCount;
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
        paidCount,
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

    if (amount === undefined || amount === null || isNaN(Number(amount)) || Number(amount) < 0) {
      return NextResponse.json(
        { success: false, error: "Valid amount is required" },
        { status: 400 }
      );
    }

    const cleanPhone = (customerPhone || "").toString().trim();
    if (cleanPhone) {
      const digitsOnly = cleanPhone.replace(/\D/g, "");
      if (digitsOnly.length !== 10) {
        return NextResponse.json(
          { success: false, error: "Phone number must be exactly 10 digits" },
          { status: 400 }
        );
      }
    }

    const newEntry = await (WashEntry as any).create({
      vehicleNumber: vehicleNumber ? vehicleNumber.toUpperCase().trim() : "",
      customerName: customerName || "",
      customerPhone: cleanPhone,
      make: make || "",
      model: model || "",
      category: category || "Hatchback (5 Seater)",
      serviceType: serviceType || "Full Wash",
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
    const {
      id,
      vehicleNumber,
      customerName,
      customerPhone,
      make,
      model,
      category,
      amount,
      paymentMode,
      paymentStatus,
      notes,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Entry ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (vehicleNumber !== undefined) updateData.vehicleNumber = vehicleNumber.toUpperCase().trim();
    if (customerName !== undefined) updateData.customerName = customerName.trim();
    if (customerPhone !== undefined) {
      const cleanPhone = customerPhone.toString().trim();
      if (cleanPhone) {
        const digitsOnly = cleanPhone.replace(/\D/g, "");
        if (digitsOnly.length !== 10) {
          return NextResponse.json(
            { success: false, error: "Phone number must be exactly 10 digits" },
            { status: 400 }
          );
        }
      }
      updateData.customerPhone = cleanPhone;
    }
    if (make !== undefined) updateData.make = make;
    if (model !== undefined) updateData.model = model;
    if (category !== undefined) updateData.category = category;
    if (amount !== undefined) updateData.amount = Number(amount);
    if (notes !== undefined) updateData.notes = notes;
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
    if (paymentMode !== undefined) {
      updateData.paymentMode = paymentMode;
      if (paymentMode === "Pending" && paymentStatus === undefined) {
        updateData.paymentStatus = "Pending";
      }
    }

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
