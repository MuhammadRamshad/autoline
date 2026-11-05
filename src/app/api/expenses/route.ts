import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Expense from "@/models/Expense";

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    const query: any = {};

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
    }

    if (category && category !== "All") {
      query.category = category;
    }

    if (search && search.trim()) {
      const clean = search.trim();
      query.$or = [
        { title: { $regex: clean, $options: "i" } },
        { paidBy: { $regex: clean, $options: "i" } },
        { notes: { $regex: clean, $options: "i" } },
      ];
    }

    const expenses = await (Expense as any).find(query).sort({ createdAt: -1 }).limit(limit).lean();

    const allMatches = await (Expense as any).find(query).lean();
    const totalExpense = allMatches.reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);
    const cashExpense = allMatches.filter((e: any) => e.paymentMode === "Cash").reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);
    const upiExpense = allMatches.filter((e: any) => e.paymentMode?.includes("UPI")).reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);

    return NextResponse.json({
      success: true,
      expenses,
      stats: {
        totalExpense,
        cashExpense,
        upiExpense,
        count: allMatches.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { title, category, amount, paymentMode, paidBy, notes } = body;

    if (!title || amount === undefined || Number(amount) <= 0) {
      return NextResponse.json(
        { success: false, error: "Title and a valid amount are required" },
        { status: 400 }
      );
    }

    const newExpense = await (Expense as any).create({
      title: title.trim(),
      category: category || "Miscellaneous",
      amount: Number(amount),
      paymentMode: paymentMode || "Cash",
      paidBy: paidBy ? paidBy.trim() : "",
      notes: notes ? notes.trim() : "",
    });

    return NextResponse.json({ success: true, expense: newExpense });
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
      return NextResponse.json({ success: false, error: "Expense ID is required" }, { status: 400 });
    }

    await (Expense as any).findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Expense deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
