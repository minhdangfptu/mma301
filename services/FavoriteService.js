import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "https://mma301-project-be-9e9f.onrender.com/favorites";

export const getFavoritesByUserId = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}?userId=${userId}`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching favorites:", error);
    throw error;
  }
};

export const addFavorite = async (photoId, userId) => {
  try {
    const response = await axios.post(API_URL, {
      photoId,
      userId,
    });
    return response.data.data;
  } catch (error) {
    console.error("Error adding favorite:", error);
    throw error;
  }
};

export const removeFavorite = async (favoriteId) => {
  try {
    const response = await axios.delete(`${API_URL}/${favoriteId}`);
    return response.data;
  } catch (error) {
    console.error("Error removing favorite:", error);
    throw error;
  }
};

export const checkIsFavorite = async (photoId, userId) => {
  try {
    const response = await axios.get(`${API_URL}?photoId=${photoId}&userId=${userId}`);
    return response.data.data.length > 0 ? response.data.data[0] : null;
  } catch (error) {
    console.error("Error checking favorite status:", error);
    throw error;
  }
};

export const toggleFavorite = async (photoId, userId) => {
  try {
    // Check if already favorited
    const favorite = await checkIsFavorite(photoId, userId);
    
    if (favorite) {
      // Remove from favorites
      await removeFavorite(favorite._id);
      return { isFavorite: false, favorite: null };
    } else {
      // Add to favorites
      const newFavorite = await addFavorite(photoId, userId);
      return { isFavorite: true, favorite: newFavorite };
    }
  } catch (error) {
    console.error("Error toggling favorite:", error);
    throw error;
  }
};