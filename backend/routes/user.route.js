import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import {
    getSuggestedConnections,
    getPublicProfile,
    updateProfile,
    getUserPosts,
    getUserSavedPosts,
    getUserReadingList,
} from "../controllers/user.controller.js";

const router = express.Router();

router.get("/suggestions", protectRoute, getSuggestedConnections);
router.get("/:username", protectRoute, getPublicProfile);
router.get("/posts", protectRoute, getUserPosts);
router.get("/saved", protectRoute, getUserSavedPosts);
router.get("/reading-list", protectRoute, getUserReadingList);

router.put("/profile", protectRoute, updateProfile);

export default router;
