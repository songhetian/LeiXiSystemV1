import { create } from 'zustand';
import { apiGet } from '../utils/apiClient';

const useChatStore = create((set, get) => ({
    contacts: [],
    activeGroupId: null,
    isLoading: false,
    error: null,

    // 设置当前活动聊天的 ID (用于决定是否增加未读数)
    setActiveGroupId: (id) => set({ activeGroupId: id }),

    // 设置所有联系人/群组
    setContacts: (contacts) => set({ contacts }),

    // 获取联系人列表
    fetchContacts: async () => {
        set({ isLoading: true });
        try {
            const res = await apiGet('/api/chat/contacts');
            if (res.success) {
                set({ contacts: res.data, isLoading: false });
            } else {
                set({ error: '加载群组失败', isLoading: false });
            }
        } catch (err) {
            set({ error: err.message, isLoading: false });
        }
    },

    // 增加未读计数
    incrementUnread: (groupId, msg, isMentioned = false) => {
        set((state) => ({
            contacts: state.contacts.map((c) => {
                if (c.id === groupId) {
                    return {
                        ...c,
                        unread_count: (Number(c.unread_count) || 0) + 1,
                        has_mention: c.has_mention || isMentioned,
                        last_message: msg.content,
                        last_message_time: msg.created_at,
                    };
                }
                return c;
            }),
        }));
    },

    // 清除未读计数
    clearUnread: (groupId) => {
        set((state) => ({
            contacts: state.contacts.map((c) =>
                c.id === groupId ? { ...c, unread_count: 0, has_mention: false } : c
            ),
        }));
    },

    // 更新最后一条消息
    updateLastMessage: (groupId, msg) => {
        set((state) => ({
            contacts: state.contacts.map((c) =>
                c.id === groupId
                    ? {
                        ...c,
                        last_message: msg.content,
                        last_message_time: msg.created_at,
                    }
                    : c
            ),
        }));
    },

    // 更新群组静音状态
    updateMuteStatus: (groupId, isMuted) => {
        set((state) => ({
            contacts: state.contacts.map((c) =>
                c.id === groupId ? { ...c, is_muted: isMuted } : c
            ),
        }));
    }
}));

export default useChatStore;
