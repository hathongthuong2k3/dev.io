import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { Image, Loader } from "lucide-react";

const PostCreation = ({ user }) => {
    const [content, setContent] = useState("");
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef();

    const queryClient = useQueryClient();

    // Fetch tag suggestions
    const { data: tagSuggestions } = useQuery({
        queryKey: ["tagSearch", tagInput],
        queryFn: async () => {
            if (!tagInput.trim()) return [];
            const res = await axiosInstance.get(`/tags/search?query=${tagInput}`);
            return res.data;
        },
        enabled: tagInput.trim().length > 0,
    });

    const { mutate: createPostMutation, isPending } = useMutation({
        mutationFn: async (postData) => {
            const res = await axiosInstance.post("/posts/create", postData, {
                headers: { "Content-Type": "application/json" },
            });
            return res.data;
        },
        onSuccess: () => {
            resetForm();
            toast.success("Post created successfully");
            queryClient.invalidateQueries({ queryKey: ["posts"] });
        },
        onError: (err) => {
            toast.error(err.response.data.message || "Failed to create post");
        },
    });

    const handlePostCreation = async () => {
        try {
            const postData = { content, tags };
            if (image) postData.image = await readFileAsDataURL(image);

            createPostMutation(postData);
        } catch (error) {
            console.error("Error in handlePostCreation:", error);
        }
    };

    const handleTagInput = (e) => {
        setTagInput(e.target.value);
        setShowSuggestions(true);
    };

    const handleTagKeyDown = (e) => {
        if ((e.key === "Enter" || e.key === ",") && tagInput.trim() && tags.length < 4) {
            e.preventDefault();
            const newTag = tagInput.trim().toLowerCase();
            if (!tags.includes(newTag)) {
                setTags([...tags, newTag]);
            }
            setTagInput("");
            setShowSuggestions(false);
        } else if (e.key === "ArrowDown" && tagSuggestions?.length) {
            e.preventDefault();
            document.getElementById("tag-suggestion-0")?.focus();
        }
    };

    const handleSuggestionClick = (tagName) => {
        if (!tags.includes(tagName)) {
            setTags([...tags, tagName]);
        }
        setTagInput("");
        setShowSuggestions(false);
        inputRef.current?.focus();
    };

    const handleRemoveTag = (tag) => {
        setTags(tags.filter((t) => t !== tag));
    };

    const resetForm = () => {
        setContent("");
        setImage(null);
        setImagePreview(null);
        setTags([]);
        setTagInput("");
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setImage(file);
        if (file) {
            readFileAsDataURL(file).then(setImagePreview);
        } else {
            setImagePreview(null);
        }
    };

    const readFileAsDataURL = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    return (
        <div className='bg-secondary rounded-lg shadow mb-4 p-4'>
            <div className='flex space-x-3'>
                <img src={user.profilePicture || "/avatar.png"} alt={user.name} className='size-12 rounded-full' />
                <textarea
                    placeholder="What's on your mind?"
                    className='w-full p-3 rounded-lg bg-base-100 hover:bg-base-200 focus:bg-base-200 focus:outline-none resize-none transition-colors duration-200 min-h-[100px]'
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
            </div>

            {/* Tag input with autocomplete */}
            <div className="mt-3 relative">
                <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                        <span key={tag} className="bg-blue-100 text-blue-700 px-2 py-1 rounded flex items-center">
                            {tag}
                            <button type="button" className="ml-1 text-red-500" onClick={() => handleRemoveTag(tag)}>×</button>
                        </span>
                    ))}
                    {tags.length < 4 && (
                        <input
                            ref={inputRef}
                            type="text"
                            className="border rounded px-2 py-1"
                            placeholder="Add tag"
                            value={tagInput}
                            onChange={handleTagInput}
                            onKeyDown={handleTagKeyDown}
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
                        />
                    )}
                </div>
                {showSuggestions && tagSuggestions && tagSuggestions.length > 0 && (
                    <ul className="absolute z-10 bg-white border rounded shadow mt-1 w-48 max-h-40 overflow-y-auto">
                        {tagSuggestions
                            .filter((t) => !tags.includes(t.name.toLowerCase()))
                            .slice(0, 8)
                            .map((t, idx) => (
                                <li
                                    key={t._id}
                                    id={`tag-suggestion-${idx}`}
                                    tabIndex={0}
                                    className="px-3 py-2 cursor-pointer hover:bg-blue-100"
                                    onMouseDown={() => handleSuggestionClick(t.name.toLowerCase())}
                                >
                                    {t.name}
                                </li>
                            ))}
                    </ul>
                )}
                <small className="text-gray-500">Add up to 4 tags...</small>
            </div>

            {imagePreview && (
                <div className='mt-4'>
                    <img src={imagePreview} alt='Selected' className='w-full h-auto rounded-lg' />
                </div>
            )}

            <div className='flex justify-between items-center mt-4'>
                <div className='flex space-x-4'>
                    <label className='flex items-center text-info hover:text-info-dark transition-colors duration-200 cursor-pointer'>
                        <Image size={20} className='mr-2' />
                        <span>Photo</span>
                        <input type='file' accept='image/*' className='hidden' onChange={handleImageChange} />
                    </label>
                </div>

                <button
                    className='bg-primary text-white rounded-lg px-4 py-2 hover:bg-primary-dark transition-colors duration-200'
                    onClick={handlePostCreation}
                    disabled={isPending}
                >
                    {isPending ? <Loader className='size-5 animate-spin' /> : "Share"}
                </button>
            </div>
        </div>
    );
};
export default PostCreation;