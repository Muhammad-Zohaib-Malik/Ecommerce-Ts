import { isAdmin } from "./../middlewares/auth.middleware.js";
import { Router } from "express";
import {
  deleteUser,
  getAllUsers,
  getUser,
  login,
  logout,
  signup,
} from "../controllers/user.controller.js";

const router = Router();
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

router.get("/all", isAdmin, getAllUsers);

router.route("/:id").get(isAdmin, getUser).delete(isAdmin, deleteUser);
export default router;
