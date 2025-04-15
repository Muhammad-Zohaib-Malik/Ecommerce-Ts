import { NextFunction, Request, Response } from "express";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../middlewares/error.middleware.js";
import jwt, { JwtPayload } from "jsonwebtoken";
import { redis } from "../config/redis.js";
import { IUser } from "../models/user.model.js";
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
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, name, password } = req.body;

    if (!email || !name || !password) {
      res
        .status(400)
        .json({ success: false, message: "All fields are required" });
      return;
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(409).json({ success: false, message: "User already exists" });
      return;
    }
    const user = await User.create({ name, email, password });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
    return;
  }
);

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
    return;
  }

  const user = await User.findOne({ email }) ;
  if (!user) {
    res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
    return;
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    res.status(401).json({
      success: false,
      message: "Invalid email or password", 
    });
    return;
  }
  const { accessToken, refreshToken } = generateTokens(user._id.toString());
  await storeRefreshToken(user._id.toString(), refreshToken);

  // Set tokens in cookies
  setCookies(res, accessToken, refreshToken);
  res.status(200).json({
    success: true,
    message: "Logged in successfully",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
  return;
});

export const logout = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user._id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized: user not found in request",
      });
      return;
    }

    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        message: "No refresh token provided",
      });
      return;
    }

    try {
      await redis.del(`refresh_token:${userId}`);

      res.clearCookie("accessToken", {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
      });
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
      });

      res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
      return;
    } catch (err) {
      res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
      return;
    }
  }
);

export const refreshToken = asyncHandler(
  async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        message: "No refresh token provided",
      });
      return;
    }

    let decoded;
    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET as string
      ) as JwtPayload;
    } catch (error) {
      res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
      return;
    }

    const accessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.ACCESS_TOKEN_SECRET as string,
      {
        expiresIn: "15m",
      }
    );

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
    return;
  }
);

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

export const getUser = asyncHandler(async (req, res, next): Promise<void> => {
  const id = req.params.id;
  const user = await User.findById(id);

  if (!user) {
    res.status(404).json("No User Found");
    return;
  }

  res.status(200).json({
    success: true,
    user,
  });
  return;
});

export const deleteUser = asyncHandler(async (req, res): Promise<void> => {
  const id = req.params.id;
  const user = await User.findByIdAndDelete(id);

  if (!user) {
    res.status(404).json("No User Found");
    return;
  }

  res.status(200).json({
    success: true,
    message: "User Delete successfully",
  });
  return;
});
