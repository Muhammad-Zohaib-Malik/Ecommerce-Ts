import mongoose, { Document, Model, Schema, Types } from "mongoose";
import bcrypt from "bcrypt";

interface ICartItem {
  quantity: number;
  product: Types.ObjectId;
}

export enum UserRole {
  ADMIN = "admin",
  USER = "user",
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: string;
  cartItems: ICartItem[];
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema:Schema<IUser> = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    cartItems: [
      {
        quantity: {
          type: Number,
          default: 1,
        },
        product: {
          type: Types.ObjectId,
          ref: "Product",
        },
      },
    ],
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (password: string) {
  return bcrypt.compare(password, this.password);
};

export const User:Model<IUser> = mongoose.model<IUser>("User", userSchema);
