import { uploadPhotos } from "../config/awsConfig.js";
import { asyncHandler } from "../middlewares/error.middleware.js";
import { Product } from "../models/product.model.js";

export const createProduct = asyncHandler(async (req, res) => {
  const { name, price, stock, category, description, isFeatured } = req.body;

  const files = req.files as Express.Multer.File[];

  if (!name || !price || !stock || !category || !description) {
    res.status(400).json({ message: "Please fill all required fields" });
    return;
  }

  const photoData = await uploadPhotos(files);

  const product = await Product.create({
    name,
    price,
    stock,
    category,
    description,
    isFeatured: isFeatured || false,
    photos: photoData,
  });

  res.status(201).json({
    success: true,
    message: "Product created successfully",
    product,
  });
});
