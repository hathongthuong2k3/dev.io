import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../../lib/axios";
import { Link } from "react-router-dom";
import { Bookmark, BookmarkCheck, Hash, Users } from "lucide-react";
import toast from "react-hot-toast";

const TagCard = ({ tag }) => {
    const queryClient = useQueryClient();

    const { data: tagDetails } = useQuery({
        queryKey: ["tagDetails", tag._id],
        queryFn: async () => {
            const res = await axiosInstance.get(`/tags/${tag._id}`);
            return res.data;
        },
    });

    const { mutate: followTag } = useMutation({
        mutationFn: () => axiosInstance.post(`/tags/${tag._id}/follow`),
        onSuccess: () => {
            queryClient.invalidateQueries(["tagDetails", tag._id]);
            toast.success("Tag followed successfully");
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to follow tag");
        },
    });

    const { mutate: unfollowTag } = useMutation({
        mutationFn: () => axiosInstance.post(`/tags/${tag._id}/unfollow`),
        onSuccess: () => {
            queryClient.invalidateQueries(["tagDetails", tag._id]);
            toast.success("Tag unfollowed successfully");
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to unfollow tag");
        },
    });

    const isFollowing = tagDetails?.isFollowing;

    return (
        <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Hash className="text-primary" size={20} />
                    <Link to={`/tags/${tag._id}`} className="font-semibold text-lg hover:text-primary">
                        {tag.name}
                    </Link>
                </div>
                <button
                    onClick={() => (isFollowing ? unfollowTag() : followTag())}
                    className={`btn btn-sm ${isFollowing ? "btn-outline" : "btn-primary"}`}
                >
                    {isFollowing ? (
                        <>
                            <BookmarkCheck size={16} className="mr-1" />
                            Following
                        </>
                    ) : (
                        <>
                            <Bookmark size={16} className="mr-1" />
                            Follow
                        </>
                    )}
                </button>
            </div>

            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{tag.description}</p>

            <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                    <Users size={16} />
                    <span>{tagDetails?.followerCount || 0} followers</span>
                </div>
                <div className="flex items-center gap-1">
                    <Bookmark size={16} />
                    <span>{tagDetails?.postCount || 0} posts</span>
                </div>
            </div>
        </div>
    );
};

export default TagCard; 