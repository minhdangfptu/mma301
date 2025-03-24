import axios from "axios";

const API_URL = "https://mma301-project-be-9e9f.onrender.com/comments";

export const getCommentsByPhotoId = async (photoId) => {
  try {
    const response = await axios.get(`${API_URL}?photoId=${photoId}`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching comments:", error);
    throw error;
  }
};

export const createComment = async (photoId, userId, content) => {
  try {
    const response = await axios.post(API_URL, {
      photoId,
      userId,
      text: content,
      rate: 5,
    });
    return response.data.data;
  } catch (error) {
    console.error("Error creating comment:", error);
    throw error;
  }
};

export const deleteComment = async (commentId) => {
  try {
    const response = await axios.delete(`${API_URL}/${commentId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting comment:", error);
    throw error;
  }
};