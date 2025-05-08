import mongoose from "mongoose";

const tagSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            maxLength: 30,
        },
        description: {
            type: String,
            default: "",
            maxLength: 200,
        },
        followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
        postCount: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
        followerCount: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },
    { timestamps: true }
);

// Index for faster search
tagSchema.index({ name: "text" });

const Tag = mongoose.model("Tag", tagSchema);

export default Tag;
