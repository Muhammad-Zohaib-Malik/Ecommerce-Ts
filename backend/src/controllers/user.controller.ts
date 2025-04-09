import { NextFunction, Request, Response } from "express";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../middlewares/error.middleware.js";
import jwt from "jsonwebtoken";
import { redis } from "../config/redis.js";

const generateTokens = (userId: string) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.ACCESS_TOKEN_SECRET as string,
    {
      expiresIn: "15m",
    }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.REFRESH_TOKEN_SECRET as string,
    {
      expiresIn: "7d",
    }
  );

  return { accessToken, refreshToken };
};

const storeRefreshToken = async (userId: string, refreshToken: string) => {
  await redis.set(
    `refresh_token:${userId}`,
    refreshToken,
    "EX",
    7 * 24 * 60 * 60
  );
};

const setCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string
) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const signup = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { email, name, password } = req.body;
    const userExists = await User.findOne({ email });

    if (!email || !name || !password) {
      res
        .status(404)
        .json({ success: false, message: "All fields are required" });
      return;
    }

    if (userExists) {
      res.status(400).json({ success: false, message: "User already exists" });
      return;
    }
    const user = await User.create({ name, email, password });

    res.status(201).json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  }
);

export const login = asyncHandler(async (req, res): Promise<void> => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && (await user.comparePassword(password))) {
    const { accessToken, refreshToken } = generateTokens(user._id.toString());
    await storeRefreshToken(user._id.toString(), refreshToken);
    setCookies(res, accessToken, refreshToken);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } else {
    res.status(400).json({ message: "Invalid email or password" });
  }
});

export const getAllUsers = asyncHandler(
  async (req, res, next): Promise<void> => {
    const users = await User.find({});

    res.status(200).json({
      success: true,
      users,
    });
    return;
  }
);
