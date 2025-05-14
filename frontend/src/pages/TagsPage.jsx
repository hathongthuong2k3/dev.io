import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import Sidebar from "../components/Sidebar";
import TagCard from "../components/tags/TagCard";
import CreateTagModal from "../components/tags/CreateTagModal";
import { useState } from "react";
import { Plus, Search } from "lucide-react";

const TagsPage = () => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const { data: authUser, isLoading: isUserLoading } = useQuery({
        queryKey: ["authUser"],
        queryFn: async () => {
            const res = await axiosInstance.get("/auth/me");
            return res.data;
        },
    });

    const { data: popularTags } = useQuery({
        queryKey: ["popularTags"],
        queryFn: async () => {
            const res = await axiosInstance.get("/tags/popular");
            return res.data;
        },
    });

    const { data: searchResults } = useQuery({
        queryKey: ["tagSearch", searchQuery],
        queryFn: async () => {
            if (!searchQuery.trim()) return [];
            const res = await axiosInstance.get(`/tags/search?q=${searchQuery}`);
            return res.data;
        },
        enabled: searchQuery.trim().length > 0,
    });

    if (isUserLoading) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="hidden lg:block lg:col-span-1">
                <Sidebar user={authUser} />
            </div>

            <div className="col-span-1 lg:col-span-3">
                <div className="bg-secondary rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold">Tags</h1>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="btn btn-primary flex items-center gap-2"
                        >
                            <Plus size={20} />
                            Create Tag
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative mb-6">
                        <input
                            type="text"
                            placeholder="Search tags..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input input-bordered w-full pl-10"
                        />
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    </div>

                    {/* Search Results */}
                    {searchQuery.trim() && (
                        <div className="mb-8">
                            <h2 className="text-xl font-semibold mb-4">Search Results</h2>
                            {searchResults?.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {searchResults.map((tag) => (
                                        <TagCard key={tag._id} tag={tag} />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-600">No tags found matching your search.</p>
                            )}
                        </div>
                    )}

                    {/* Popular Tags */}
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Popular Tags</h2>
                        {popularTags?.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {popularTags.map((tag) => (
                                    <TagCard key={tag._id} tag={tag} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-600">No popular tags available.</p>
                        )}
                    </div>
                </div>
            </div>

            {isCreateModalOpen && (
                <CreateTagModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                />
            )}
        </div>
    );
};

export default TagsPage; 