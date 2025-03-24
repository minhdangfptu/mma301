import axios from "axios";

const API_URL = "https://mma301-project-be-9e9f.onrender.com";

export const deletePhoto = async (photoId) => {
  try {
    const response = await axios.delete(`${API_URL}/photos/${photoId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updatePhoto = async (photoId, photoData) => {
  try {
    const response = await axios.put(`${API_URL}/photos/${photoId}`, photoData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};