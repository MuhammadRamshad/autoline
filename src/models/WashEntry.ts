import mongoose, { Schema, Model } from "mongoose";

export interface IWashEntry {
  vehicleNumber: string;
  customerName?: string;
  customerPhone: string;
  make: string;
  model: string;
  category: string;
  serviceType: string;
  amount: number;
  paymentMode: "UPI / QR" | "Cash" | "Pending";
  paymentStatus: "Paid" | "Pending";
  parivahanDetails?: {
    ownerName?: string;
    makerModel?: string;
    fuelType?: string;
    regDate?: string;
    insuranceUpto?: string;
    rcStatus?: string;
    rtoOffice?: string;
  };
  notes?: string;
  status: "In Queue" | "Washing" | "Vacuuming" | "Completed" | "Delivered";
  createdAt?: Date;
  updatedAt?: Date;
}

const WashEntrySchema = new Schema<IWashEntry>(
  {
    vehicleNumber: { type: String, required: true, uppercase: true, trim: true, index: true },
    customerName: { type: String, default: "" },
    customerPhone: { type: String, required: true, trim: true, index: true },
    make: { type: String, default: "" },
    model: { type: String, default: "" },
    category: { type: String, required: true, default: "Hatchback (5 Seater)" },
    serviceType: { 
      type: String, 
      default: "Full Wash" 
    },
    amount: { type: Number, required: true, min: 0 },
    paymentMode: { 
      type: String, 
      enum: ["UPI / QR", "Cash", "Pending", "Card", "Credit / Pay Later", "Pay Later"],
      default: "UPI / QR" 
    },
    paymentStatus: {
      type: String,
      enum: ["Paid", "Pending"],
      default: "Paid"
    },
    parivahanDetails: {
      ownerName: String,
      makerModel: String,
      fuelType: String,
      regDate: String,
      insuranceUpto: String,
      rcStatus: String,
      rtoOffice: String,
    },
    notes: { type: String, default: "" },
    status: {
      type: String,
      enum: ["In Queue", "Washing", "Vacuuming", "Completed", "Delivered"],
      default: "Completed"
    }
  },
  { timestamps: true }
);

const WashEntry: Model<IWashEntry> =
  (mongoose.models && mongoose.models.WashEntry) ||
  mongoose.model<IWashEntry>("WashEntry", WashEntrySchema);

export default WashEntry;
