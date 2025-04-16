import mongoose, { Schema, Document, Model, Types } from "mongoose";

interface IPhoto {
  url: string;
  key: string;
}

export interface IProduct extends Document {
  name: string;
  photos: IPhoto[];
  price: number;
  stock: number;
  category: string;
  description: string;
  ratings: number;
  numOfReviews: number;
  isFeatured: boolean;
}

const productSchema: Schema<IProduct> = new Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter Name"],
    },
    photos: [
      {
        url: {
          type: String,
          required: [true, "Please provide photo URL"],
        },
        key: {
          type: String,
          required: [true, "Please provide photo key"],
        },
      },
    ],
    price: {
      type: Number,
      required: [true, "Please enter Price"],
    },
    stock: {
      type: Number,
      required: [true, "Please enter Stock"],
    },
    category: {
      type: String,
      required: [true, "Please enter Category"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Please enter Description"],
    },
    ratings: {
      type: Number,
      default: 0,
    },
    numOfReviews: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);


export const Product: Model<IProduct> = mongoose.model<IProduct>("Product", productSchema);
