import mongoose, { Schema, Model } from "mongoose";

export interface IPriceSetting {
  category: string;
  price: number;
  group?: string;
  order?: number;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const PriceSettingSchema = new Schema<IPriceSetting>(
  {
    category: { type: String, required: true, unique: true },
    price: { type: Number, required: true, default: 0 },
    group: { type: String, default: "other" },
    order: { type: Number, default: 99 },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

const PriceSetting: Model<IPriceSetting> =
  (mongoose.models && mongoose.models.PriceSetting) ||
  mongoose.model<IPriceSetting>("PriceSetting", PriceSettingSchema);

export default PriceSetting;
