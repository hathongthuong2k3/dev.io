import express from "express";
import {
    postAddToReadingList,
    postRemoveFromReadingList,
    postUpdateReadingStatus,
    getReadingListByUser,
} from "../controllers/readingList.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protectRoute);

router.get("/", getReadingListByUser);
router.post("/:postId", postAddToReadingList);
router.delete("/:postId", postRemoveFromReadingList);
router.patch("/status/:postId", postUpdateReadingStatus);

export default router;
