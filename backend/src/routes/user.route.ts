import { Router } from "express";
import { getAllUsers, login, signup } from "../controllers/user.controller.js";

const router = Router();
router.post("/signup", signup);
router.post("/login", login);
router.get("/all", getAllUsers);

export default router;
