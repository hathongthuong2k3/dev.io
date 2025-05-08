import User from "../models/user.model.js";
import Post from "../models/post.model.js";

export const getReadingListByUser = async (req, res) => {
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

        // filter by status if any
        if (status) {
            readingList = readingList.filter((item) => item.status === status);
        }

        // sort by time added
        readingList.sort((a, b) => b.addedAt - a.addedAt);

        res.json(readingList);
    } catch (error) {
        console.error("Error in getReadingListByUser:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const postAddToReadingList = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user._id;

        // Check if post exists
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Check if post already in reading list
        const user = await User.findById(userId);
        const existingItem = user.readingList.find(
            (item) => item.post.toString() === postId
        );

        if (existingItem) {
            return res
                .status(400)
                .json({ message: "Post already in reading list" });
        }

        // Add to reading list
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
        console.error("Error in postAddToReadingList controller:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const postRemoveFromReadingList = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user._id;

        // Check if post exists
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Check if post in reading list
        const user = await User.findById(userId);
        const existingItem = user.readingList.find(
            (item) => item.post.toString() === postId
        );
        if (!existingItem) {
            return res
                .status(404)
                .json({ message: "Post not in reading list" });
        }

        // Remove from reading list
        const updatedReadingList = user.readingList.filter(
            (item) => item.post.toString() !== postId
        );
        await User.findByIdAndUpdate(userId, {
            $set: { readingList: updatedReadingList },
        });

        res.status(200).json({ message: "Removed from reading list" });
    } catch (error) {
        console.error("Error in postRemoveFromReadingList controller:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const postUpdateReadingStatus = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user._id;
        const { status } = req.body;

        // Check if status is not allowed
        if (
            status != "unread" &&
            status != "reading" &&
            status != "completed"
        ) {
            return res.status(400).json({ message: "Invalid status" });
        }

        // Check if post exists
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Check if post in reading list
        const user = await User.findById(userId);
        const existingItem = user.readingList.find(
            (item) => item.post.toString() === postId
        );
        if (!existingItem) {
            return res
                .status(404)
                .json({ message: "Post not in reading list" });
        }

        // Update reading status
        const updatedReadingList = user.readingList.map((item) => {
            if (item.post.toString() === postId) {
                return { ...item, status };
            }
            return item;
        });
        await User.findByIdAndUpdate(userId, {
            $set: { readingList: updatedReadingList },
        });

        res.status(200).json({ message: "Reading status updated" });
    } catch (error) {
        console.error("Error in postUpdateReadingStatus controller:", error);
        res.status(500).json({ message: "Server error" });
    }
};
