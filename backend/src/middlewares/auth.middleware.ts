import jwt, { JwtPayload } from "jsonwebtoken";
import { asyncHandler } from "./error.middleware.js";
import { User } from "../models/user.model.js";

interface DecodedToken extends JwtPayload {
  userId: string;
}

declare global {
  namespace Express {
    interface Request {
      userId: string;
      user: InstanceType<typeof User>;
    }
  }
}

export const protectRoute = asyncHandler(async (req, res, next) => {
  const accessToken = req.cookies.accessToken;

  if (!accessToken) {
    res
      .status(401)
      .json({ message: "Unauthorized - No access token provided" });
    return;
  }

  try {
    const decoded = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET as string
    ) as DecodedToken;

    req.userId = decoded.userId;

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }

    req.user = user;

    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized - Invalid token" });
    return;
  }
});

export const isAdmin = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Access denied - Admin only" });
    return;
  }
});
