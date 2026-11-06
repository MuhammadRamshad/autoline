import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import PriceSetting from "@/models/PriceSetting";
import { INITIAL_VEHICLE_CATEGORIES } from "@/lib/vehicleCategories";

export async function GET() {
  try {
    await dbConnect();
    let prices = await (PriceSetting as any).find({}).sort({ order: 1, createdAt: 1 }).lean();

    // If no prices yet or old defaults exist, seed/sync with requested structure
    if (!prices || prices.length === 0) {
      await (PriceSetting as any).insertMany(INITIAL_VEHICLE_CATEGORIES);
      prices = await (PriceSetting as any).find({}).sort({ order: 1, createdAt: 1 }).lean();
    } else {
      // Check if newly requested categories exist, insert any missing
      const existingNames = new Set(prices.map((p: any) => p.category));
      const missing = INITIAL_VEHICLE_CATEGORIES.filter((c) => !existingNames.has(c.category));
      if (missing.length > 0) {
        await (PriceSetting as any).insertMany(missing);
        prices = await (PriceSetting as any).find({}).sort({ order: 1, createdAt: 1 }).lean();
      }
    }

    const formattedPrices = prices.map((p: any) => ({
      _id: p._id,
      category: p.category,
      group: p.group || "other",
      price: Number(p.price) || 0,
      order: p.order ?? 99,
      notes: p.notes || ""
    }));

    return NextResponse.json({
      success: true,
      prices: formattedPrices,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { category, price, group, order, notes } = body;

    if (!category) {
      return NextResponse.json({ success: false, error: "Category is required" }, { status: 400 });
    }

    const updateObj: any = {
      price: Math.max(0, Number(price) || 0),
    };
    if (group !== undefined) updateObj.group = group;
    if (order !== undefined) updateObj.order = Number(order);
    if (notes !== undefined) updateObj.notes = notes;

    const updated = await (PriceSetting as any).findOneAndUpdate(
      { category },
      { $set: updateObj },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, price: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const id = searchParams.get("id");

    if (id) {
      await (PriceSetting as any).findByIdAndDelete(id);
      return NextResponse.json({ success: true, message: "Price deleted" });
    }

    if (category) {
      await (PriceSetting as any).findOneAndDelete({ category });
      return NextResponse.json({ success: true, message: "Category deleted" });
    }

    return NextResponse.json({ success: false, error: "ID or Category required" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
