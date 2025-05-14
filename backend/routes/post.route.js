import express from "express";
import {
    createComment,
    createPost,
    deletePost,
    getFeedPosts,
    getPostById,
    getPostsByTag,
    getPostsByUser,
    getSavedUsers,
    getSavedPostsForUser,
    likePost,
    updatePost,
} from "../controllers/post.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", protectRoute, getFeedPosts);
router.get("/:id", protectRoute, getPostById);
router.get("/tag/:id", protectRoute, getPostsByTag);
router.get("/user/:id", protectRoute, getPostsByUser);
router.get("/:id/saved-users", protectRoute, getSavedUsers);
router.get("/:id/saved-posts", protectRoute, getSavedPostsForUser);

router.post("/create", protectRoute, createPost);
router.put("/update/:id", protectRoute, updatePost);
router.delete("/delete/:id", protectRoute, deletePost);
router.post("/:id/comment", protectRoute, createComment);
router.post("/:id/like", protectRoute, likePost);

export default router;
