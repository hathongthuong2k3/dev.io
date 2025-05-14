import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { Link, useParams } from "react-router-dom";
import { Loader, MessageCircle, Send, Share2, ThumbsUp, Trash2, Bookmark, BookmarkCheck, Pencil } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import PostAction from "./PostAction";

const Post = ({ post }) => {
	const { postId } = useParams();

	const { data: authUser } = useQuery({ queryKey: ["authUser"] });
	const [showComments, setShowComments] = useState(false);
	const [newComment, setNewComment] = useState("");
	const [comments, setComments] = useState(post.comments || []);
	const isOwner = authUser._id === post.author._id;
	const isLiked = Array.isArray(post.likes) && post.likes.includes(authUser._id);

	const queryClient = useQueryClient();

	// Reading List state
	const { data: readingList } = useQuery({
		queryKey: ["readingList"],
		enabled: !!authUser,
	});
	const isSaved = readingList?.some((item) => item.post._id === post._id);

	const { mutate: savePost, isPending: isSaving } = useMutation({
		mutationFn: () => axiosInstance.post(`/reading-list/${post._id}`),
		onSuccess: () => {
			queryClient.invalidateQueries(["readingList"]);
			toast.success("Saved to Reading List");
		},
		onError: () => toast.error("Failed to save post")
	});
	const { mutate: unsavePost, isPending: isUnsaving } = useMutation({
		mutationFn: () => axiosInstance.delete(`/reading-list/${post._id}`),
		onSuccess: () => {
			queryClient.invalidateQueries(["readingList"]);
			toast.success("Removed from Reading List");
		},
		onError: () => toast.error("Failed to remove post")
	});

	const { mutate: deletePost, isPending: isDeletingPost } = useMutation({
		mutationFn: async () => {
			await axiosInstance.delete(`/posts/delete/${post._id}`);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["posts"] });
			toast.success("Post deleted successfully");
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const { mutate: createComment, isPending: isAddingComment } = useMutation({
		mutationFn: async (newComment) => {
			await axiosInstance.post(`/posts/${post._id}/comment`, { content: newComment });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["posts"] });
			toast.success("Comment added successfully");
		},
		onError: (err) => {
			toast.error(err.response.data.message || "Failed to add comment");
		},
	});

	const { mutate: likePost, isPending: isLikingPost } = useMutation({
		mutationFn: async () => {
			await axiosInstance.post(`/posts/${post._id}/like`);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["posts"] });
			queryClient.invalidateQueries({ queryKey: ["post", postId] });
		},
	});

	const [isEditing, setIsEditing] = useState(false);
	const [editContent, setEditContent] = useState(post.content);
	const [editImage, setEditImage] = useState(post.image || null);
	const [editImagePreview, setEditImagePreview] = useState(post.image || null);
	const [editTags, setEditTags] = useState(post.tags || []);
	const [tagInput, setTagInput] = useState("");

	// Update edit fields when opening modal
	useEffect(() => {
		if (isEditing) {
			setEditContent(post.content);
			setEditImage(post.image || null);
			setEditImagePreview(post.image || null);
			setEditTags(post.tags || []);
			setTagInput("");
		}
	}, [isEditing, post]);

	const { mutate: updatePost, isPending: isUpdating } = useMutation({
		mutationFn: async (data) => {
			await axiosInstance.put(`/posts/update/${post._id}`, data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["posts"] });
			toast.success("Post updated successfully");
			setIsEditing(false);
		},
		onError: (err) => {
			toast.error(err.response?.data?.message || "Failed to update post");
		},
	});

	const handleEditImageChange = (e) => {
		const file = e.target.files[0];
		setEditImage(file);
		if (file) {
			readFileAsDataURL(file).then(setEditImagePreview);
		} else {
			setEditImagePreview(null);
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
	const handleEditTagAdd = () => {
		if (tagInput.trim() && !editTags.includes(tagInput.trim())) {
			setEditTags([...editTags, tagInput.trim()]);
			setTagInput("");
		}
	};
	const handleEditTagRemove = (tag) => {
		setEditTags(editTags.filter((t) => t !== tag));
	};
	const handleEditSubmit = async (e) => {
		e.preventDefault();
		let imageData = editImage;
		if (editImage && typeof editImage !== "string") {
			imageData = await readFileAsDataURL(editImage);
		}
		updatePost({ content: editContent, image: imageData, tags: editTags });
	};

	const handleDeletePost = () => {
		if (!window.confirm("Are you sure you want to delete this post?")) return;
		deletePost();
	};

	const handleLikePost = async () => {
		if (isLikingPost) return;
		likePost();
	};

	const handleAddComment = async (e) => {
		e.preventDefault();
		if (newComment.trim()) {
			createComment(newComment);
			setNewComment("");
			setComments([
				...comments,
				{
					content: newComment,
					user: {
						_id: authUser._id,
						name: authUser.name,
						profilePicture: authUser.profilePicture,
					},
					createdAt: new Date(),
				},
			]);
		}
	};

	return (
		<div className='bg-secondary rounded-lg shadow mb-4'>
			<div className='p-4'>
				<div className='flex items-center justify-between mb-4'>
					<div className='flex items-center'>
						<Link to={`/profile/${post?.author?.username}`}>
							<img
								src={post.author.profilePicture || "/avatar.png"}
								alt={post.author.name}
								className='size-10 rounded-full mr-3'
							/>
						</Link>

						<div>
							<Link to={`/profile/${post?.author?.username}`}>
								<h3 className='font-semibold'>{post.author.name}</h3>
							</Link>
							<p className='text-xs text-info'>{post.author.headline}</p>
							<p className='text-xs text-info'>
								{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
							</p>
						</div>
					</div>
					<div className='flex items-center gap-2'>
						{isOwner && (
							<>
								<button onClick={() => setIsEditing(true)} className='text-green-500 hover:text-green-700'>
									<Pencil size={18} />
								</button>
								<button onClick={handleDeletePost} className='text-red-500 hover:text-red-700'>
									{isDeletingPost ? <Loader size={18} className='animate-spin' /> : <Trash2 size={18} />}
								</button>
							</>
						)}
						{/* Save/Unsave button */}
						<button
							onClick={() => (isSaved ? unsavePost() : savePost())}
							className={`text-blue-500 hover:text-blue-700 ml-2`}
							title={isSaved ? "Remove from Reading List" : "Save to Reading List"}
							disabled={isSaving || isUnsaving}
						>
							{isSaved ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
						</button>
					</div>
				</div>
				<p className='mb-4'>{post.content}</p>
				{post.tags && post.tags.length > 0 && (
  <div className="flex flex-wrap gap-2 mb-4">
    {post.tags.map((tag) => (
      <Link
        key={typeof tag === "string" ? tag : tag._id}
        to={`/tags/${typeof tag === "string" ? tag : tag._id}`}
        className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium hover:underline"
      >
        {tag.name || tag}
      </Link>
    ))}
  </div>
)}
				{post.image && <img src={post.image} alt='Post content' className='rounded-lg w-full mb-4' />}

				<div className='flex justify-between text-info'>
					<PostAction
						icon={<ThumbsUp size={18} className={isLiked ? "text-blue-500  fill-blue-300" : ""} />}
						text={`Like (${Array.isArray(post.likes) ? post.likes.length : 0})`}
						onClick={handleLikePost}
					/>

					<PostAction
						icon={<MessageCircle size={18} />}
						text={`Comment (${Array.isArray(comments) ? comments.length : 0})`}
						onClick={() => setShowComments(!showComments)}
					/>
					<PostAction icon={<Share2 size={18} />} text='Share' />
				</div>
			</div>

			{showComments && (
				<div className='px-4 pb-4'>
					<div className='mb-4 max-h-60 overflow-y-auto'>
						{comments.map((comment) => (
							<div key={comment._id} className='mb-2 bg-base-100 p-2 rounded flex items-start'>
								<img
									src={comment.user.profilePicture || "/avatar.png"}
									alt={comment.user.name}
									className='w-8 h-8 rounded-full mr-2 flex-shrink-0'
								/>
								<div className='flex-grow'>
									<div className='flex items-center mb-1'>
										<span className='font-semibold mr-2'>{comment.user.name}</span>
										<span className='text-xs text-info'>
											{formatDistanceToNow(new Date(comment.createdAt))}
										</span>
									</div>
									<p>{comment.content}</p>
								</div>
							</div>
						))}
					</div>

					<form onSubmit={handleAddComment} className='flex items-center'>
						<input
							type='text'
							value={newComment}
							onChange={(e) => setNewComment(e.target.value)}
							placeholder='Add a comment...'
							className='flex-grow p-2 rounded-l-full bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary'
						/>

						<button
							type='submit'
							className='bg-primary text-white p-2 rounded-r-full hover:bg-primary-dark transition duration-300'
							disabled={isAddingComment}
						>
							{isAddingComment ? <Loader size={18} className='animate-spin' /> : <Send size={18} />}
						</button>
					</form>
				</div>
			)}

			{isEditing && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 w-full max-w-lg relative">
						<button
							onClick={() => setIsEditing(false)}
							className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
						>
							&times;
						</button>
						<h2 className="text-xl font-bold mb-4">Edit Post</h2>
						<form onSubmit={handleEditSubmit} className="space-y-4">
							<div>
								<textarea
									className="textarea textarea-bordered w-full"
									value={editContent}
									onChange={(e) => setEditContent(e.target.value)}
									rows={4}
									required
								/>
							</div>
							<div>
								<label className="block mb-1 font-medium">Image</label>
								{editImagePreview && (
									<img src={editImagePreview} alt="Preview" className="rounded mb-2 max-h-48" />
								)}
								<input type="file" accept="image/*" onChange={handleEditImageChange} />
							</div>
							<div>
								<label className="block mb-1 font-medium">Tags</label>
								<div className="flex gap-2 mb-2 flex-wrap">
									{editTags.map((tag) => (
										<span key={tag} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1">
											{tag}
											<button type="button" onClick={() => handleEditTagRemove(tag)} className="ml-1 text-red-500">&times;</button>
										</span>
									))}
								</div>
								<div className="flex gap-2">
									<input
										type="text"
										value={tagInput}
										onChange={(e) => setTagInput(e.target.value)}
										className="input input-bordered flex-1"
										placeholder="Add tag"
									/>
									<button type="button" className="btn btn-primary" onClick={handleEditTagAdd}>Add</button>
								</div>
							</div>
							<div className="flex justify-end gap-2">
								<button type="button" className="btn btn-ghost" onClick={() => setIsEditing(false)}>Cancel</button>
								<button type="submit" className="btn btn-primary" disabled={isUpdating}>
									{isUpdating ? "Saving..." : "Save Changes"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
};
export default Post;
