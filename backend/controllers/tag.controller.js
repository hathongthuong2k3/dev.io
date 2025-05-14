import Tag from "../models/tag.model.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";

export const getSearchTags = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query || query.length < 2) {
            return res.status(400).json({
                message: "Search query must be at least 2 characters",
            });
        }

        const tags = await Tag.find({
            $text: { $search: query },
        })
            .select("name followerCount postCount")
            .sort({ followerCount: -1, postCount: -1 })
            .limit(10);

        res.json(tags);
    } catch (error) {
        console.error("Error in searchTags controller:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getTagDetails = async (req, res) => {
    try {
        const { tagId } = req.params;

        const tag = await Tag.findById(tagId)
            .populate("followers", "name username profilePicture")
            .populate("posts", "content image createdAt");

        if (!tag) return res.status(404).json({ message: "Tag not found" });

        res.json(tag);
    } catch (error) {
        console.error("Error in getTagDetails controller:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getPopularTags = async (req, res) => {
    try {
        const tags = await Tag.find()
            .sort({ followerCount: -1, postCount: -1 })
            .limit(10)
            .select("name followerCount postCount");

        res.json(tags);
    } catch (error) {
        console.error("Error in getPopularTags controller:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getPostsByTag = async (req, res) => {
    try {
        const { tagId } = req.params;

        const tag = await Tag.findById(tagId)
            .populate({
                path: "posts",
                select: "author content image tags createdAt",
                populate: [
                    {
                        path: "author",
                        select: "username name profilePicture headline"
                    },
                    {
                        path: "tags",
                        select: "name"
                    }
                ]
            });

        if (!tag) return res.status(404).json({ message: "Tag not found" });

        res.json(tag.posts);
    } catch (error) {
        console.error("Error in getPostsByTag controller:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const postCreateTag = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Tag name is required" });
        }

        const normalizedName = name.trim().toLowerCase();

        // Check if tag already exists
        let tag = await Tag.findOne({ name: normalizedName });

        if (tag) {
            return res.status(200).json(tag);
        }

        // Create new tag if it doesn't exist
        tag = new Tag({
            name: normalizedName,
            description: req.body.description || "",
        });

        await tag.save();

        res.status(201).json(tag);
    } catch (error) {
        console.error("Error in createTag controller:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const postFollowTag = async (req, res) => {
    try {
        const { tagId } = req.params;
        const userId = req.user._id;

        const [tag, user] = await Promise.all([
            Tag.findById(tagId),
            User.findById(userId),
        ]);

        if (!tag) return res.status(404).json({ message: "Tag not found" });

        // Check if user already follows this tag
        if (user.followedTags.includes(tagId)) {
            return res
                .status(400)
                .json({ message: "Already following this tag" });
        }

        // Update both sides
        await Promise.all([
            Tag.findByIdAndUpdate(tagId, {
                $addToSet: { followers: userId },
                $inc: { followerCount: 1 },
            }),
            User.findByIdAndUpdate(userId, {
                $addToSet: { followedTags: tagId },
            }),
        ]);

        res.json({ message: "Successfully followed tag" });
    } catch (error) {
        console.error("Error in followTag controller:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const postUnfollowTag = async (req, res) => {
    try {
        const { tagId } = req.params;
        const userId = req.user._id;

        const [tag, user] = await Promise.all([
            Tag.findById(tagId),
            User.findById(userId),
        ]);

        // Check if tag exists
        if (!tag) return res.status(404).json({ message: "Tag not found" });

        // Check if user is following this tag
        if (!user.followedTags.includes(tagId)) {
            return res.status(400).json({ message: "Not following this tag" });
        }

        await Promise.all([
            Tag.findByIdAndUpdate(tagId, {
                $pull: { followers: userId },
                $inc: { followerCount: -1 },
            }),
            User.findByIdAndUpdate(userId, {
                $pull: { followedTags: tagId },
            }),
        ]);

        res.json({ message: "Successfully unfollowed tag" });
    } catch (error) {
        console.error("Error in unfollowTag controller:", error);
        res.status(500).json({ message: "Server error" });
    }
};
