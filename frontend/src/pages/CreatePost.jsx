// components/CreatePostForm.jsx
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import ReactQuill from "react-quill";
import { TagsInput } from "react-tag-input-component";
import "react-quill/dist/quill.snow.css";

const CreatePostForm = ({ onSubmit }) => {
    const [content, setContent] = useState("");
    const { register, handleSubmit } = useForm();
    const [selectedTags, setSelectedTags] = useState([]);

    const handleContentChange = (value) => {
        setContent(value);
    };

    const handleTagChange = (tags) => {
        if (tags.length > 4) return;
        setSelectedTags(tags);
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <form
                onSubmit={handleSubmit((data) =>
                    onSubmit({ ...data, content, tags: selectedTags })
                )}
            >
                {/* Title Input */}
                <input
                    {...register("title", { required: true })}
                    placeholder="New post title here..."
                    className="w-full text-3xl font-bold mb-6 p-2 border-b-2 focus:outline-none focus:border-blue-500"
                />

                {/* Tags Input */}
                <div className="mb-6">
                    <TagsInput
                        value={selectedTags}
                        onChange={handleTagChange}
                        name="tags"
                        placeHolder="Add up to 4 tags..."
                        beforeAddValidate={(tag) => tag.length <= 20}
                        classNames={{
                            input: "p-2 text-sm",
                            tag: "bg-gray-200 px-2 py-1 rounded-full text-sm mr-2 mb-2",
                        }}
                    />
                    <p className="text-sm text-gray-500 mt-2">
                        Add comma-separated tags (e.g. react, javascript,
                        webdev)
                    </p>
                </div>

                {/* Content Editor */}
                <div className="mb-6">
                    <ReactQuill
                        theme="snow"
                        value={content}
                        onChange={handleContentChange}
                        placeholder="Write your post content here..."
                        className="h-96 mb-4"
                    />
                </div>

                {/* Tagging Guidelines */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h3 className="font-bold mb-2">Tagging Guidelines</h3>
                    <ul className="list-disc pl-6 text-sm text-gray-600">
                        <li>Use existing tags whenever possible</li>
                        <li>Combine tags for better reach (max 4)</li>
                        <li>Avoid redundant or irrelevant tags</li>
                    </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                    <button
                        type="submit"
                        className="bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600"
                    >
                        Publish
                    </button>
                    <button
                        type="button"
                        className="bg-gray-200 px-6 py-2 rounded-full hover:bg-gray-300"
                    >
                        Save Draft
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreatePostForm;
