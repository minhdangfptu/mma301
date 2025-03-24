import axios from "axios";

const API_URL = "https://mma301-project-be-9e9f.onrender.com/albums";

export const getAlbumsByUserId = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}?userId=${userId}`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching albums:", error);
    throw error;
  }
};

export const createAlbum = async (title, userId) => {
  try {
    const response = await axios.post(API_URL, { title, userId });
    return response.data.data;
  } catch (error) {
    console.error("Error creating album:", error);
    throw error;
  }
};

export const addPhotoToAlbum = async (photoId, albumId) => {
  try {
    const response = await axios.put(`${API_URL}/${albumId}/photos/${photoId}`);
    return response.data.data;
  } catch (error) {
    console.error("Error adding photo to album:", error);
    throw error;
  }
};