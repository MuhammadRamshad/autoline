import mongoose, { Schema, Model } from "mongoose";

export interface IExpense {
  title: string;
  category: "Chemicals & Soap" | "Electricity & Water" | "Staff & Daily Wages" | "Maintenance & Tools" | "Refreshments / Tea" | "Rent" | "Fuel / Diesel" | "Miscellaneous";
  amount: number;
  paymentMode: "Cash" | "UPI / QR";
  paidBy?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      default: "Miscellaneous",
    },
    amount: { type: Number, required: true, min: 0 },
    paymentMode: {
      type: String,
      enum: ["Cash", "UPI / QR"],
      default: "Cash",
    },
    paidBy: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

const Expense: Model<IExpense> =
  (mongoose.models && mongoose.models.Expense) ||
  mongoose.model<IExpense>("Expense", ExpenseSchema);

export default Expense;
