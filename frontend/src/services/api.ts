import axios from 'axios';
import useAuthStore from '../store/authStore';

const API_URL = "http://localhost:3000/api";

const getAuthHeaders = () => {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.data?.message?.includes('jwt')) {
      console.log('JWT error detected, logging out...');
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface Post {
  _id: string;
  author: {
    _id: string;
    username: string;
    fullName: string;
    avatarUrl?: string;
  };
  content: string;
  imageUrl?: string;
  image?: string;
  likes: Array<string | { _id: string; username: string }>;
  comments: Array<{
    _id: string;
    author: {
      _id: string;
      username: string;
      fullName: string;
      avatarUrl?: string;
    };
    content: string;
    createdAt: string;
    likes: string[];
  }>;
  createdAt: string;
  showComments?: boolean;
}

export interface User {
  _id: string;
  username: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  followers: string[];
  following: string[];
  posts: string[];
}

export interface Comment {
  _id: string;
  content: string;
  author: User;
  post: string;
  createdAt: string;
  likes: string[];
}

export interface Notification {
  _id: string;
  type: 'like' | 'comment' | 'follow';
  from: User;
  to: string;
  post?: Post;
  comment?: Comment;
  read: boolean;
  createdAt: string;
}

export interface Message {
  _id: string;
  from: User;
  to: User;
  text: string;
  createdAt: string;
}

export const postsApi = {
  async getAllPosts(): Promise<Post[]> {
    const response = await axios.get(`${API_URL}/posts`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  async getPostById(postId: string): Promise<Post> {
    const response = await axios.get(`${API_URL}/posts/${postId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  async createPost(content: string, image?: string): Promise<Post> {
    const response = await axios.post(`${API_URL}/posts`, {
      content,
      image
    }, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  async createSamplePosts(): Promise<{ message: string; posts: Post[] }> {
    const response = await axios.post(`${API_URL}/posts/sample`, {}, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  async likePost(postId: string): Promise<{ message: string; likes: number; isLiked: boolean }> {
    const response = await axios.post(`${API_URL}/posts/${postId}/like`, {}, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  async addComment(postId: string, content: string): Promise<Post> {
    const response = await axios.post(`${API_URL}/comments/${postId}`, {
      content
    }, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  async getUserPosts(userId: string): Promise<Post[]> {
    const response = await axios.get(`${API_URL}/posts/user/${userId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  async deletePost(postId: string): Promise<void> {
    await axios.delete(`${API_URL}/posts/${postId}`, {
      headers: getAuthHeaders()
    });
  },

  async updatePost(postId: string, data: { content?: string; imageUrl?: string }): Promise<Post> {
    const response = await axios.put(`${API_URL}/posts/${postId}`, data, {
      headers: getAuthHeaders()
    });
    return response.data;
  }
};

export const usersApi = {
  async getAllUsers(): Promise<User[]> {
    const response = await axios.get(`${API_URL}/users`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  async getUserById(userId: string): Promise<User> {
    const response = await axios.get(`${API_URL}/users/${userId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  async followUser(userId: string): Promise<void> {
    await axios.post(`${API_URL}/follows/${userId}`, {}, {
      headers: getAuthHeaders()
    });
  },

  async unfollowUser(userId: string): Promise<void> {
    await axios.delete(`${API_URL}/follows/${userId}`, {
      headers: getAuthHeaders()
    });
  },

  async searchUsers(query: string): Promise<User[]> {
    const response = await axios.get(`${API_URL}/search/users?q=${query}`, {
      headers: getAuthHeaders()
    });
    return response.data.users || response.data;
  },

  async updateProfile(data: {
    fullName?: string;
    username?: string;
    bio?: string;
    avatarUrl?: string;
  }): Promise<User> {
    const response = await axios.put(`${API_URL}/users/profile`, data, {
      headers: getAuthHeaders()
    });
    return response.data.user || response.data;
  }
};

export const messagesApi = {
  async getMessages(userId: string): Promise<Message[]> {
    const response = await axios.get(`${API_URL}/messages/${userId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  async sendMessage(to: string, text: string): Promise<Message> {
    const response = await axios.post(`${API_URL}/messages`, {
      to,
      text
    }, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  async getUserConversations(): Promise<any[]> {
    const response = await axios.get(`${API_URL}/messages/conversations`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  async getUnreadCount(): Promise<number> {
    const response = await axios.get(`${API_URL}/messages/unread-count`, {
      headers: getAuthHeaders()
    });
    return response.data.count || 0;
  },

  async getLastUnreadMessage(): Promise<{ userId: string; username: string } | null> {
    const response = await axios.get(`${API_URL}/messages/last-unread`, {
      headers: getAuthHeaders()
    });
    return response.data;
  }
};

export const commentsApi = {
  async likeComment(postId: string, commentId: string): Promise<{ message: string; likesCount: number; isLiked: boolean }> {
    const response = await axios.post(`${API_URL}/comments/${postId}/${commentId}/like`, {}, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  async editComment(postId: string, commentId: string, content: string): Promise<Post> {
    const response = await axios.put(`${API_URL}/comments/${postId}/${commentId}`, {
      content
    }, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  async deleteComment(postId: string, commentId: string): Promise<Post> {
    const response = await axios.delete(`${API_URL}/comments/${postId}/${commentId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  }
};

export const uploadApi = {
  async uploadImage(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await axios.post(`${API_URL}/upload`, formData, {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};

// Notifications API
export const notificationsApi = {
  async getNotifications(): Promise<Notification[]> {
    const response = await axios.get(`${API_URL}/notifications`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  async getUnreadCount(): Promise<{ count: number }> {
    const response = await axios.get(`${API_URL}/notifications/unread-count`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  async markAsRead(notificationId: string): Promise<void> {
    await axios.put(`${API_URL}/notifications/${notificationId}/read`, {}, {
      headers: getAuthHeaders()
    });
  }
}; 