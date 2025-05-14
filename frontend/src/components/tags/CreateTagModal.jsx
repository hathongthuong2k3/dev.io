import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { axiosInstance } from "../../lib/axios";
import toast from "react-hot-toast";
import { X } from "lucide-react";

const CreateTagModal = ({ isOpen, onClose }) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const queryClient = useQueryClient();

    const { mutate: createTag, isPending } = useMutation({
        mutationFn: async (tagData) => {
            const res = await axiosInstance.post("/tags/create", tagData);
            return res.data;
        },
        onSuccess: () => {
            toast.success("Tag created successfully");
            queryClient.invalidateQueries(["popularTags"]);
            onClose();
            resetForm();
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to create tag");
        },
    });

    const resetForm = () => {
        setName("");
        setDescription("");
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error("Tag name is required");
            return;
        }
        createTag({ name: name.trim(), description: description.trim() });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
                >
                    <X size={24} />
                </button>

                <h2 className="text-2xl font-bold mb-4">Create New Tag</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Tag Name
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter tag name"
                            className="input input-bordered w-full"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Enter tag description"
                            className="textarea textarea-bordered w-full h-24"
                        />
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-ghost"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isPending}
                        >
                            {isPending ? "Creating..." : "Create Tag"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTagModal; 