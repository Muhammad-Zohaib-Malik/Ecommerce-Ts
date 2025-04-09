import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";

interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "admin" | "user";
  cartItems: Array<{
    quantity: number;
    product: mongoose.Types.ObjectId;
  }>;
  comparePassword(candidatePassword: string): Promise<boolean>;
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
    cartItems: [
      {
        quantity: {
          type: Number,
          default: 1,
        },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
      },
    ],
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (password: string) {
  return bcrypt.compare(password, this.password);
};

export const User = mongoose.model<IUser>("User", userSchema);
