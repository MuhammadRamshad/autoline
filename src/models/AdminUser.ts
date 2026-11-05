import mongoose, { Schema, Model } from "mongoose";

export interface IAdminUser {
  username: string;
  password: string; // Plaintext or hashed for easy manual creation in Atlas
  name?: string;
  role?: string;
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const AdminUserSchema = new Schema<IAdminUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      default: "Admin",
    },
    role: {
      type: String,
      default: "superadmin",
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const AdminUser: Model<IAdminUser> =
  (mongoose.models && mongoose.models.AdminUser) ||
  mongoose.model<IAdminUser>("AdminUser", AdminUserSchema);

export default AdminUser;
