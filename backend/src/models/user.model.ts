import mongoose from "mongoose";
import validator from "validator";

interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "admin" | "user";
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema(
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
      validate: {
        validator: (value: string): boolean => validator.isEmail(value),
        message: "Please enter a valid email address",
      },
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      validate: {
        validator: (value: string): boolean => {
          return validator.isStrongPassword(value, {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1,
          });
        },
        message:
          "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character",
      },
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>("User", userSchema);
