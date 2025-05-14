import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import Sidebar from "../components/Sidebar";
import Post from "../components/Post";
import { Loader, Bookmark, BookmarkX } from "lucide-react";
import { useState } from "react";

const ReadingListPage = () => {
    const queryClient = useQueryClient();
    const { data: authUser, isLoading: isUserLoading } = useQuery({
        queryKey: ["authUser"],
        queryFn: async () => {
            const res = await axiosInstance.get("/auth/me");
            return res.data;
        },
    });

    const { data: readingList, isLoading } = useQuery({
        queryKey: ["readingList"],
        queryFn: async () => {
            const res = await axiosInstance.get("/reading-list");
            return res.data;
        },
        enabled: !!authUser,
    });

    const { mutate: removeFromReadingList, isPending: isRemoving } = useMutation({
        mutationFn: (postId) => axiosInstance.delete(`/reading-list/${postId}`),
        onSuccess: () => {
            queryClient.invalidateQueries(["readingList"]);
        },
    });

    if (isUserLoading || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader className="animate-spin" size={48} />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="hidden lg:block lg:col-span-1">
                <Sidebar user={authUser} />
            </div>
            <div className="col-span-1 lg:col-span-3">
                <div className="bg-secondary rounded-lg shadow p-6">
                    <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <Bookmark size={28} /> Reading List
                    </h1>
                    {readingList?.length > 0 ? (
                        <div className="space-y-4">
                            {readingList.map((item) => (
                                <div key={item._id} className="relative group">
                                    <Post post={item.post} />
                                    <button
                                        className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow hover:bg-red-100 transition"
                                        title="Remove from Reading List"
                                        onClick={() => removeFromReadingList(item.post._id)}
                                        disabled={isRemoving}
                                    >
                                        <BookmarkX size={20} className="text-red-500" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-lg shadow">
                            <Bookmark size={48} className="mx-auto text-gray-400 mb-4" />
                            <h2 className="text-xl font-semibold mb-2">Your reading list is empty</h2>
                            <p className="text-gray-600">Save posts to read them later!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReadingListPage; 