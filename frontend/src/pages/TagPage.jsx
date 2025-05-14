import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { axiosInstance } from "../lib/axios";
import Sidebar from "../components/Sidebar";
import Post from "../components/Post";
import TagCard from "../components/tags/TagCard";
import { Hash, Loader } from "lucide-react";

const TagPage = () => {
    const { tagId } = useParams();
    const { data: authUser, isLoading: isUserLoading } = useQuery({
        queryKey: ["authUser"],
        queryFn: async () => {
            const res = await axiosInstance.get("/auth/me");
            return res.data;
        },
    });
    const { data: tag, isLoading: isTagLoading } = useQuery({
        queryKey: ["tagDetails", tagId],
        queryFn: async () => {
            const res = await axiosInstance.get(`/tags/${tagId}`);
            return res.data;
        },
    });

    const { data: posts, isLoading: isPostsLoading } = useQuery({
        queryKey: ["tagPosts", tagId],
        queryFn: async () => {
            const res = await axiosInstance.get(`/tags/${tagId}/posts`);
            return res.data;
        },
    });

    if (isTagLoading || isPostsLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader className="animate-spin" size={48} />
            </div>
        );
    }

    if (!tag) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-800">Tag not found</h2>
                <p className="text-gray-600 mt-2">The tag you're looking for doesn't exist.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="hidden lg:block lg:col-span-1">
                <Sidebar user={authUser}/>
            </div>

            <div className="col-span-1 lg:col-span-3">
                {/* Tag Header */}
                <div className="bg-secondary rounded-lg shadow p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Hash className="text-primary" size={32} />
                        <h1 className="text-3xl font-bold">{tag.name}</h1>
                    </div>
                    <p className="text-gray-600 mb-4">{tag.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{tag.followerCount} followers</span>
                        <span>{tag.postCount} posts</span>
                    </div>
                </div>

                {/* Tag Posts */}
                <div>
                    <h2 className="text-xl font-semibold mb-4">Posts tagged with {tag.name}</h2>
                    {posts?.length > 0 ? (
                        <div className="space-y-4">
                            {posts.map((post) => (
                                <Post key={post._id} post={post} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-lg shadow">
                            <p className="text-gray-600">No posts found with this tag.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TagPage; 