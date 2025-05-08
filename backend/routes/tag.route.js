import express from "express";
import {
    postCreateTag,
    getSearchTags,
    postFollowTag,
    postUnfollowTag,
    getTagDetails,
    getPopularTags,
    getPostsByTag,
} from "../controllers/tag.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/create", protectRoute, postCreateTag);
router.get("/search", getSearchTags);
router.get("/:tagId", getTagDetails);
router.get("/popular", getPopularTags);
router.post("/:tagId/follow", protectRoute, postFollowTag);
router.post("/:tagId/unfollow", protectRoute, postUnfollowTag);
router.get("/:tagId/posts", getPostsByTag);

export default router;
