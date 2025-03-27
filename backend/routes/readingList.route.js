import express from "express";
import {
    addToReadingList,
    removeFromReadingList,
    updateReadingStatus,
    getReadingList,
} from "../controllers/readingList.controller.js";
import protectRoute from "../middlewares/protectRoute.js";

const router = express.Router();

router.use(protectRoute);

router.post("/:postId", addToReadingList);
router.delete("/:postId", removeFromReadingList);
router.patch("/:postId/status", updateReadingStatus);
router.get("/", getReadingList);

export default router;
