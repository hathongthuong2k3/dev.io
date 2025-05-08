import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import Tag from "../models/tag.model.js";
import cloudinary from "../lib/cloudinary.js";

export const getSuggestedConnections = async (req, res) => {
    try {
        const currentUser = await User.findById(req.user._id).select(
            "connections"
        );

        // find users who are not already connected, and also do not recommend our own profile!! right?
        const suggestedUser = await User.find({
            _id: {
                $ne: req.user._id,
                $nin: currentUser.connections,
            },
        })
            .select("name username profilePicture headline")
            .limit(3);

        res.json(suggestedUser);
    } catch (error) {
        console.error("Error in getSuggestedConnections controller:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getPublicProfile = async (req, res) => {
    try {
        const user = await User.findOne({
            username: req.params.username,
        }).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user);
    } catch (error) {
        console.error("Error in getPublicProfile controller:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getUserPosts = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate("posts");
        res.json(user.posts);
    } catch (error) {
        console.error("Error in getUserPosts controller:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getUserSavedPosts = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate("savedPosts");
        res.json(user.savedPosts);
    } catch (error) {
        console.error("Error in getUserSavedPosts controller:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getUserReadingList = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate("readingList");
        res.json(user.readingList);
    } catch (error) {
        console.error("Error in getUserReadingList controller:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const allowedFields = [
            "name",
            "username",
            "headline",
            "about",
            "location",
            "profilePicture",
            "bannerImg",
            "skills",
            "experience",
            "education",
        ];

        const updatedData = {};

        for (const field of allowedFields) {
            if (req.body[field]) {
                updatedData[field] = req.body[field];
            }
        }

        if (req.body.profilePicture) {
            const result = await cloudinary.uploader.upload(
                req.body.profilePicture
            );
            updatedData.profilePicture = result.secure_url;
        }

        if (req.body.bannerImg) {
            const result = await cloudinary.uploader.upload(req.body.bannerImg);
            updatedData.bannerImg = result.secure_url;
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updatedData },
            { new: true }
        ).select("-password");

        res.json(user);
    } catch (error) {
        console.error("Error in updateProfile controller:", error);
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
                return { ...item, status: req.body.status };
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

export const postUpdatePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user._id;
        const { content, image, tags } = req.body;

        // Check if post exists
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Check if user is the owner of the post
        if (post.author.toString() !== userId) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // Update post
        await Post.findByIdAndUpdate(postId, { content, image, tags });

        res.status(200).json({ message: "Post updated" });
    } catch (error) {
        console.error("Error in postUpdatePost controller:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const postDeletePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user._id;

        // Check if post exists
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Check if user is the owner of the post
        if (post.author.toString() !== userId) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // Delete post
        await Post.findByIdAndDelete(postId);

        res.status(200).json({ message: "Post deleted" });
    } catch (error) {
        console.error("Error in postDeletePost controller:", error);
        res.status(500).json({ message: "Server error" });
    }
};
