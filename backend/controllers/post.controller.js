import cloudinary from "../lib/cloudinary.js";
import Post from "../models/post.model.js";
import Tag from "../models/tag.model.js";
import Notification from "../models/notification.model.js";
import { sendCommentNotificationEmail } from "../emails/emailHandlers.js";

export const getFeedPosts = async (req, res) => {
    try {
        const posts = await Post.find({
            author: { $in: [...req.user.connections, req.user._id] },
        })
            .populate("author", "name username profilePicture headline")
            .populate("comments.user", "name profilePicture")
            .populate("tags", "name")
            .sort({ createdAt: -1 });

        res.status(200).json(posts);
    } catch (error) {
        console.error("Error in getFeedPosts controller:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getPostById = async (req, res) => {
    try {
        const postId = req.params.id;
        const post = await Post.findById(postId)
            .populate("author", "name username profilePicture headline")
            .populate("comments.user", "name profilePicture username headline")
            .populate("tags", "name")

        res.status(200).json(post);
    } catch (error) {
        console.error("Error in getPostById controller:", error);
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
            })
            .populate("tags", "name");

        if (!tag) return res.status(404).json({ message: "Tag not found" });

        res.json(tag.posts);
    } catch (error) {
        console.error("Error in getPostsByTag controller:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getPostsByUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const posts = await Post.find({ author: userId })
        .populate("tags", "name");
        res.status(200).json(posts);
    } catch (error) {
        console.error("Error in getPostsByUser controller:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getSavedUsers = async (req, res) => {
    try {
        const postId = req.params.id;
        const savedUsers = await User.find({ savedPosts: postId })
        .populate("tags", "name");
        res.status(200).json(savedUsers);
    } catch (error) {
        console.error("Error in getSavedUsers controller:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getSavedPostsForUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const savedPosts = await Post.find({ savedUsers: userId })
        .populate("tags", "name");
        res.status(200).json(savedPosts);
    } catch (error) {
        console.error("Error in getSavedPosts controller:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const createPost = async (req, res) => {
    try {
        const { content, image, tags: tagNames } = req.body;
        const userId = req.user._id;

        const post = new Post({
            author: userId,
            content,
        });
        await post.save();

        let tagIds = [];
        if (tagNames && tagNames.length > 0) {
            for (const tagName of tagNames) {
                // Normalize tag name
                const normalized = tagName.trim().toLowerCase();
                let tag = await Tag.findOne({ name: normalized });
                if (!tag) {
                    tag = new Tag({ name: normalized, posts: [post._id], postCount: 1 });
                    await tag.save();
                } else {
                    tag.posts.push(post._id);
                    tag.postCount++;
                    await tag.save();
                }
                tagIds.push(tag._id);
            }
            post.tags = tagIds;
            await post.save();
        }

        // save image to cloudinary
        if (image) {
            const imgResult = await cloudinary.uploader.upload(image);
            post.image = imgResult.secure_url;
            await post.save();
        }

        res.status(201).json(post);
    } catch (error) {
        console.error("Error in createPost controller:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const deletePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user._id;

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // check if the current user is the author of the post
        if (post.author.toString() !== userId.toString()) {
            return res.status(403).json({
                message: "You are not authorized to delete this post",
            });
        }

        // delete the image from cloudinary as well!
        if (post.image) {
            await cloudinary.uploader.destroy(
                post.image.split("/").pop().split(".")[0]
            );
        }

        await Post.findByIdAndDelete(postId);

        res.status(200).json({ message: "Post deleted successfully" });
    } catch (error) {
        console.log("Error in delete post controller", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

export const createComment = async (req, res) => {
    try {
        const postId = req.params.id;
        const { content } = req.body;

        const post = await Post.findByIdAndUpdate(
            postId,
            {
                $push: { comments: { user: req.user._id, content } },
            },
            { new: true }
        ).populate("author", "name email username headline profilePicture");

        // create a notification if the comment owner is not the post owner
        if (post.author._id.toString() !== req.user._id.toString()) {
            const newNotification = new Notification({
                recipient: post.author,
                type: "comment",
                relatedUser: req.user._id,
                relatedPost: postId,
            });

            await newNotification.save();

            try {
                const postUrl = process.env.CLIENT_URL + "/post/" + postId;
                await sendCommentNotificationEmail(
                    post.author.email,
                    post.author.name,
                    req.user.name,
                    postUrl,
                    content
                );
            } catch (error) {
                console.log(
                    "Error in sending comment notification email:",
                    error
                );
            }
        }

        res.status(200).json(post);
    } catch (error) {
        console.error("Error in createComment controller:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const likePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const post = await Post.findById(postId);
        const userId = req.user._id;

        if (post.likes.includes(userId)) {
            // unlike the post
            post.likes = post.likes.filter(
                (id) => id.toString() !== userId.toString()
            );
        } else {
            // like the post
            post.likes.push(userId);
            // create a notification if the post owner is not the user who liked
            if (post.author.toString() !== userId.toString()) {
                const newNotification = new Notification({
                    recipient: post.author,
                    type: "like",
                    relatedUser: userId,
                    relatedPost: postId,
                });

                await newNotification.save();
            }
        }

        await post.save();

        res.status(200).json(post);
    } catch (error) {
        console.error("Error in likePost controller:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const updatePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const { content, image, tags } = req.body;

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        if (image) {
            await cloudinary.uploader.destroy(
                post.image.split("/").pop().split(".")[0]
            );

            const imgResult = await cloudinary.uploader.upload(image);
            post.image = imgResult.secure_url;
        }

        await Post.findByIdAndUpdate(postId, { content, image, tags });

        res.status(200).json({ message: "Post updated" });
    } catch (error) {
        console.error("Error in updatePost controller:", error);
        res.status(500).json({ message: "Server error" });
    }
};
