import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        username: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        profilePicture: {
            type: String,
            default: "",
        },
        bannerImg: {
            type: String,
            default: "",
        },
        headline: {
            type: String,
            default: "Linkedin User",
        },
        location: {
            type: String,
            default: "Earth",
        },
        about: {
            type: String,
            default: "",
        },
        skills: [String],
        experience: [
            {
                title: String,
                company: String,
                startDate: Date,
                endDate: Date,
                description: String,
            },
        ],
        education: [
            {
                school: String,
                fieldOfStudy: String,
                startYear: Number,
                endYear: Number,
            },
        ],
        connections: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        readingList: [
            {
                post: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Post",
                },
                addedAt: {
                    type: Date,
                    default: Date.now,
                },
                status: {
                    type: String,
                    enum: ["unread", "reading", "completed"],
                    default: "unread",
                },
            },
        ],
        posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
        followedTags: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tag" }],
    },
    { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
