import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import PriceSetting from "@/models/PriceSetting";
import { INDIAN_VEHICLES_DATABASE } from "@/lib/vehicleDatabase";

const DEFAULT_CATEGORY_PRICES = [
  { category: "Bike / Scooter", price: 150, notes: "All two wheelers & scooters" },
  { category: "Hatchback (5 Seater)", price: 350, notes: "Alto, Swift, i10, Baleno, Tiago, etc." },
  { category: "Sedan (5 Seater)", price: 420, notes: "Dzire, Verna, City, Virtus, Ciaz, etc." },
  { category: "Compact SUV (5 Seater)", price: 480, notes: "Brezza, Creta, Nexon, Sonet, Thar, etc." },
  { category: "SUV / MUV (7 Seater)", price: 600, notes: "Innova, Scorpio, XUV700, Safari, Ertiga, etc." },
  { category: "Luxury / Large Vehicle", price: 850, notes: "BMW, Mercedes, Audi, Fortuner, Defender, etc." },
  { category: "Auto / Commercial", price: 300, notes: "Auto Rickshaws, Tata Ace, Pickup, Vans" },
];

export async function GET() {
  try {
    await dbConnect();
    let prices = await (PriceSetting as any).find({}).sort({ createdAt: 1 }).lean();

    if (!prices || prices.length === 0) {
      await (PriceSetting as any).insertMany(DEFAULT_CATEGORY_PRICES);
      prices = await (PriceSetting as any).find({}).sort({ createdAt: 1 }).lean();
    }

    // Attach vehicles list mapped under each category from INDIAN_VEHICLES_DATABASE
    const enrichedPrices = prices.map((p: any) => {
      const matchingVehicles = INDIAN_VEHICLES_DATABASE.filter(
        (v) => v.category === p.category
      ).map((v) => `${v.make} ${v.model}`);
      return {
        ...p,
        price: p.price ?? 350,
        vehicles: matchingVehicles,
      };
    });

    return NextResponse.json({
      success: true,
      prices: enrichedPrices,
      vehiclesCatalog: INDIAN_VEHICLES_DATABASE,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { category, price, notes } = body;

    if (!category) {
      return NextResponse.json({ success: false, error: "Category is required" }, { status: 400 });
    }

    const updated = await (PriceSetting as any).findOneAndUpdate(
      { category },
      { 
        price: Number(price),
        notes: notes || "" 
      },
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
    } else if (category) {
      await (PriceSetting as any).findOneAndDelete({ category });
    } else {
      return NextResponse.json({ success: false, error: "Category or id required" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Category deleted" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
