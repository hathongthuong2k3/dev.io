import User from "../models/user.model.js";
import Post from "../models/post.model.js";

export const addToReadingList = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user._id;

        // Kiểm tra post tồn tại
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Kiểm tra đã có trong reading list chưa
        const user = await User.findById(userId);
        const existingItem = user.readingList.find(
            (item) => item.post.toString() === postId
        );

        if (existingItem) {
            return res
                .status(400)
                .json({ message: "Post already in reading list" });
        }

        // Thêm vào reading list
        await User.findByIdAndUpdate(userId, {
            $push: {
                readingList: {
                    post: postId,
                    status: "unread",
                },
            },
        });

        res.status(201).json({ message: "Added to reading list" });
    } catch (error) {
        console.error("Error in addToReadingList:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const removeFromReadingList = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user._id;

        await User.findByIdAndUpdate(userId, {
            $pull: {
                readingList: { post: postId },
            },
        });

        res.json({ message: "Removed from reading list" });
    } catch (error) {
        console.error("Error in removeFromReadingList:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const updateReadingStatus = async (req, res) => {
    try {
        const { postId } = req.params;
        const { status } = req.body;
        const userId = req.user._id;

        if (!["unread", "reading", "completed"].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        await User.updateOne(
            {
                _id: userId,
                "readingList.post": postId,
            },
            {
                $set: {
                    "readingList.$.status": status,
                },
            }
        );

        res.json({ message: "Reading status updated" });
    } catch (error) {
        console.error("Error in updateReadingStatus:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getReadingList = async (req, res) => {
    try {
        const userId = req.user._id;
        const { status } = req.query;

        const user = await User.findById(userId).populate({
            path: "readingList.post",
            select: "title content author createdAt",
            populate: {
                path: "author",
                select: "name username profilePicture",
            },
        });

        let readingList = user.readingList;

        // Lọc theo status nếu có
        if (status) {
            readingList = readingList.filter((item) => item.status === status);
        }

        // Sắp xếp theo thời gian thêm mới nhất
        readingList.sort((a, b) => b.addedAt - a.addedAt);

        res.json(readingList);
    } catch (error) {
        console.error("Error in getReadingList:", error);
        res.status(500).json({ message: "Server error" });
    }
};
