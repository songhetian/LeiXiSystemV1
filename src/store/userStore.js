import { create } from 'zustand';
import api from '../api';

const useUserStore = create((set, get) => ({
  userMap: {}, // ID -> RealName/Username mapping
  users: [],   // Full employee list
  isLoading: false,
  isInitialized: false,

  // Fetch all employees and build the map
  fetchUsers: async (force = false) => {
    // Avoid double fetching
    if (get().isInitialized && !force) return;

    set({ isLoading: true });
    try {
      // Use the corrected path /employees
      const response = await api.get('/employees?includeDeleted=true');
      const userData = Array.isArray(response.data) ? response.data : [];
      
      const map = {};
      userData.forEach(u => {
        map[u.user_id] = u.real_name || u.username || `ID ${u.user_id}`;
      });

      set({ 
        users: userData, 
        userMap: map, 
        isLoading: false, 
        isInitialized: true 
      });
    } catch (error) {
      console.error('Failed to initialize user store:', error);
      set({ isLoading: false });
    }
  },

  // Helper to get name by ID
  getNameById: (id) => {
    const map = get().userMap;
    return map[id] || `ID ${id}`;
  },

  // Clear store (on logout)
  clearStore: () => set({ 
    userMap: {}, 
    users: [], 
    isInitialized: false 
  })
}));

export default useUserStore;
