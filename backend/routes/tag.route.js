import express from "express";
import {
    createTag,
    searchTags,
    followTag,
    unfollowTag,
    getTagDetails,
    getPopularTags,
} from "../controllers/tag.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", protectRoute, createTag);
router.get("/search", searchTags);
router.get("/popular", getPopularTags);
router.get("/:tagId", getTagDetails);
router.post("/:tagId/follow", protectRoute, followTag);
router.post("/:tagId/unfollow", protectRoute, unfollowTag);

export default router;
