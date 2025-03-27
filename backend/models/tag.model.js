import mongoose from "mongoose";

const tagSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            maxlength: 30,
        },
        description: {
            type: String,
            default: "",
            maxlength: 200,
        },
        followers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        posts: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Post",
            },
        ],
        postCount: {
            type: Number,
            default: 0,
        },
        followerCount: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

// Index for faster search
tagSchema.index({ name: "text" });

const Tag = mongoose.model("Tag", tagSchema);

export default Tag;
