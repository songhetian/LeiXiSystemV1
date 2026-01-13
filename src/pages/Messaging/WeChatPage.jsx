import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  SearchOutlined,
  PlusOutlined,
  UserOutlined,
  TeamOutlined,
  MoreOutlined,
  SmileOutlined,
  PictureOutlined,
  FileOutlined,
  SendOutlined,
  CloseOutlined,
  BellOutlined,
  AudioMutedOutlined
} from '@ant-design/icons';
import { message, Modal, Upload, Avatar, Badge, Tooltip, Image, Drawer, List, Dropdown, Mentions } from 'antd';
import { tokenManager, apiGet, apiPost } from '../../utils/apiClient';
import { wsManager } from '../../services/websocket';
import useChatStore from '../../store/chatStore';

const { Option } = Mentions;

// Simple Shadcn-like Button Component
const Button = ({ children, onClick, variant = 'primary', className = '', ...props }) => {
  const baseStyle = "px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variants = {
    primary: "bg-[#07c160] text-white hover:bg-[#06ad56] focus:ring-green-500",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-700",
    destructive: "bg-red-500 text-white hover:bg-red-600"
  };

  return (
    <button
      onClick={onClick}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// Input Component
const Input = ({ className = '', ...props }) => (
  <input
    className={`flex h-8 w-full rounded-sm border border-[#d1d1d1] bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#07c160] transition-all ${className}`}
    {...props}
  />
);

// --- Custom CSS for Bubbles ---
const bubbleStyles = `
  .chat-message-item {
    content-visibility: auto;
    contain-intrinsic-size: 80px;
  }
  .chat-bubble-me::after {
    content: '';
    position: absolute;
    right: -6px;
    top: 10px;
    width: 0;
    height: 0;
    border-top: 6px solid transparent;
    border-bottom: 6px solid transparent;
    border-left: 8px solid #95ec69;
  }
  .chat-bubble-other::after {
    content: '';
    position: absolute;
    left: -6px;
    top: 10px;
    width: 0;
    height: 0;
    border-top: 6px solid transparent;
    border-bottom: 6px solid transparent;
    border-right: 8px solid #ffffff;
  }
  .chat-bubble-other-mention::after {
    border-right-color: #fef3c7;
  }
`;

const WeChatPage = () => {
  // --- State from Store ---
  const { contacts, fetchContacts, incrementUnread, clearUnread, setActiveGroupId } = useChatStore();

  // --- Local State ---
  const [currentUser, setCurrentUser] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Group Details
  const [isMembersDrawerOpen, setIsMembersDrawerOpen] = useState(false);
  const [currentGroupMembers, setCurrentGroupMembers] = useState([]);

  // Create Group Modal (Admin only)
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const activeChatRef = useRef(null);

  const isAdmin = useMemo(() => {
    return currentUser?.role === '超级管理员' || currentUser?.role === 'admin';
  }, [currentUser]);

  // --- Initialization ---
  useEffect(() => {
    const token = tokenManager.getToken();
    if (!token) return;

    const user = tokenManager.parseToken(token);
    setCurrentUser(user);

    // Initial fetch if empty
    if (contacts.length === 0) {
      fetchContacts();
    }

    const handleReceiveMessage = (msg) => {
      const currentChat = activeChatRef.current;
      if (currentChat && msg.group_id === currentChat.id) {
        setMessages(prev => [...prev, msg]);
        apiPost('/api/chat/read', { groupId: currentChat.id, messageId: msg.id });
        setTimeout(scrollToBottom, 50);
      } else {
        // Unread logic is handled by App.jsx -> chatStore globally
        // We just need to trigger notification if window hidden (optional, can also move to App.jsx)
        if (document.hidden) {
          showNotification(msg);
        }
      }
    };

    const handleMemberUpdate = (data) => {
      const currentChat = activeChatRef.current;
      if (currentChat && data.groupId === currentChat.id) {
        console.log('👥 群成员发生变动，正在刷新...', data);
        fetchMembers(data.groupId);
      }
    };

    wsManager.on('receive_message', handleReceiveMessage);
    wsManager.on('member_update', handleMemberUpdate);

    return () => {
      wsManager.off('receive_message', handleReceiveMessage);
      wsManager.off('member_update', handleMemberUpdate);
    };
  }, []);

  useEffect(() => {
    activeChatRef.current = activeChat;
    setActiveGroupId(activeChat?.id || null);
  }, [activeChat]);

  // Removed general auto-scroll effect to avoid conflict with load-more position logic

  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  // --- Logic ---

  const fetchContactsLocal = async () => {
    await fetchContacts();
  };

  const fetchHistory = async (chat, beforeId = null) => {
    if (isLoadingMore) return;

    const limit = 30;
    const isInitial = beforeId === null;

    if (!isInitial) setIsLoadingMore(true);

    try {
      const url = `/api/chat/history?targetId=${chat.id}&targetType=group&limit=${limit}${beforeId ? `&beforeId=${beforeId}` : ''}`;
      const res = await apiGet(url);

      if (res.success) {
        const newMsgs = res.data;

        if (isInitial) {
          setMessages(newMsgs);
          setHasMore(newMsgs.length === limit);
          if (newMsgs.length > 0) {
            const lastMsgId = newMsgs[newMsgs.length - 1].id;
            apiPost('/api/chat/read', { groupId: chat.id, messageId: lastMsgId });
          }
          setTimeout(scrollToBottom, 100);
        } else {
          // Loading older messages
          const container = scrollContainerRef.current;
          const oldScrollHeight = container.scrollHeight;

          setMessages(prev => [...newMsgs, ...prev]);
          setHasMore(newMsgs.length === limit);
          setIsLoadingMore(false);

          // After state update and render, restore scroll position
          setTimeout(() => {
            if (container) {
              container.scrollTop = container.scrollHeight - oldScrollHeight;
            }
          }, 0);
        }
      }
    } catch (err) {
      console.error(err);
      setIsLoadingMore(false);
    }
  };

  const handleScroll = (e) => {
    const { scrollTop } = e.currentTarget;
    if (scrollTop === 0 && hasMore && !isLoadingMore && activeChat) {
      const firstMsgId = messages.length > 0 ? messages[0].id : null;
      if (firstMsgId) {
        fetchHistory(activeChat, firstMsgId);
      }
    }
  };

  const fetchMembers = async (groupId) => {
    try {
      const res = await apiGet(`/api/chat/groups/${groupId}/members`);
      if (res.success) {
        setCurrentGroupMembers(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleMute = async (groupId, currentMute) => {
    try {
      const res = await apiPost('/api/chat/mute', { groupId, isMuted: !currentMute });
      if (res.success) {
        setContacts(prev => prev.map(c => c.id === groupId ? { ...c, is_muted: !currentMute } : c));
        if (activeChat?.id === groupId) {
          setActiveChat(prev => ({ ...prev, is_muted: !currentMute }));
        }
        message.success(!currentMute ? '已开启免打扰' : '已关闭免打扰');
      }
    } catch (err) {
      message.error('操作失败');
    }
  };

  const openCreateGroupModal = async () => {
    setIsGroupModalOpen(true);
    try {
      const res = await apiGet('/api/chat/users');
      if (res.success) setAllUsers(res.data);
    } catch (err) { console.error(err); }
  };

  const showNotification = (msg) => {
    if (!("Notification" in window)) return;
    const group = contacts.find(c => c.id === msg.group_id);

    // Check if I am mentioned in the text
    const myName = currentUser?.real_name || currentUser?.name;
    const isMentioned = msg.content && myName && msg.content.includes(`@${myName}`);

    // If muted AND not mentioned, don't show
    if (group?.is_muted && !isMentioned) return;

    if (Notification.permission === "granted") {
      const title = isMentioned
        ? `[有人@你] ${msg.group_name || group?.name || "群聊"}`
        : (msg.group_name || group?.name || "新消息");

      new Notification(title, {
        body: `${msg.sender_name}: ${msg.content}`,
        icon: '/icons/logo.ico'
      });
    }
  }

  const selectChat = (item) => {
    setActiveChat({ ...item, type: 'group' });
    // 清除全局 store 中的未读数和艾特状态
    clearUnread(item.id);

    // 标记已读
    apiPost('/api/chat/read', { groupId: item.id }).then(() => {
      // 成功标记已读后，通知全局未读数刷新
      if (wsManager.socket) {
        wsManager.socket.emit('request_unread_count');
      }
    });

    fetchHistory(item);
    fetchMembers(item.id);
    if (wsManager.socket) {
      wsManager.socket.emit('join_group', item.id);
    }
  };

  const sendMessage = async (content = inputText, type = 'text', fileUrl = null) => {
    if ((!content || !content.trim() && !fileUrl) || !activeChat || !wsManager.socket) return;
    const payload = { targetId: activeChat.id, targetType: 'group', content, type, fileUrl };
    wsManager.socket.emit('send_message', payload);
    setInputText('');
  };

  const handleFileUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const baseUrl = window.location.port === '5173' ? 'http://localhost:3001' : window.location.origin;
      const res = await fetch(`${baseUrl}/api/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${tokenManager.getToken()}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        const fullUrl = `${baseUrl}${data.url}`;
        sendMessage(data.filename, file.type.startsWith('image/') ? 'image' : 'file', fullUrl);
      }
    } catch (err) {
      message.error('上传失败');
    }
    return false;
  };

  const createGroup = async () => {
    if (!groupName || selectedMembers.length === 0) return;
    try {
      const res = await apiPost('/api/chat/groups', { name: groupName, memberIds: selectedMembers });
      if (res.success) {
        message.success('群组创建成功');
        setIsGroupModalOpen(false);
        fetchContacts();
        setGroupName('');
        setSelectedMembers([]);
      }
    } catch (err) { message.error('Failed to create group'); }
  };

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  // --- Render Helpers ---

  const renderAvatar = (user, size = 40, className = '') => {
    const name = user?.name || user?.sender_name || user?.real_name || 'User';
    const avatarUrl = user?.avatar || user?.sender_avatar;

    if (avatarUrl) {
      return <Avatar shape="square" src={avatarUrl} size={size} className={`rounded-[4px] ${className}`} icon={<UserOutlined />} />;
    }

    // Generate a background color based on the name length or first char
    const colors = ['#f56a00', '#7265e6', '#ffbf00', '#00a2ae', '#1890ff', '#13c2c2', '#eb2f96'];
    const color = colors[name.length % colors.length];
    const initial = name.charAt(0).toUpperCase();

    return (
      <Avatar
        shape="square"
        size={size}
        className={`rounded-[4px] ${className}`}
        style={{ backgroundColor: color, verticalAlign: 'middle' }}
      >
        {initial}
      </Avatar>
    );
  };

  const filteredContacts = useMemo(() => {
    if (!searchQuery) return contacts;
    return contacts.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [contacts, searchQuery]);

  const renderContactList = () => {
    return (
      <div className="overflow-y-auto h-full space-y-0.5">
        {filteredContacts.length > 0 ? (
          <div>
            {filteredContacts.map(g => (
              <div
                key={`group-${g.id}`}
                onClick={() => selectChat(g)}
                className={`flex items-center p-3 cursor-pointer transition-colors ${activeChat?.id === g.id ? 'bg-[#c8c6c6]' : 'hover:bg-[#d9d8d8]'}`}
              >
                <Badge count={g.is_muted ? 0 : (g.unread_count || 0)} dot={g.is_muted && (Number(g.unread_count) > 0)} size="small" offset={[-2, 2]}>
                  {renderAvatar(g)}
                </Badge>
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-[14px] font-normal text-[#000] truncate">{g.name}</span>
                    <span className="text-[11px] text-[#999]">{g.last_message_time && new Date(g.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex justify-between items-center h-4">
                    <div className="text-[12px] text-[#999] truncate flex-1">
                      {g.has_mention && <span className="text-[#f5222d]">[有人@我] </span>}
                      {g.last_message || '暂无消息'}
                    </div>
                    {g.is_muted && <AudioMutedOutlined className="text-[12px] text-[#999] ml-1" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center text-gray-400 text-sm">{searchQuery ? '未找到相关群组' : '暂无群组'}</div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-[93vh] bg-[#f5f5f5] overflow-hidden font-sans border-b border-gray-200">

      {/* 1. Sidebar (Contacts/Chat List) */}
      <div className="w-[310px] bg-[#e7e7e7] flex flex-col border-r border-[#d1d1d1]">
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 bg-[#f5f5f5] drag-region gap-2">
          <div className="relative flex-1">
            <SearchOutlined className="absolute left-2.5 top-2 text-[#666] text-xs" />
            <Input
              placeholder="搜索"
              className="pl-8 h-7 bg-[#e2e2e2] border-none text-xs rounded-[4px]"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          {isAdmin && (
            <button className="p-1 hover:bg-[#e2e2e2] rounded flex items-center justify-center transition-colors flex-shrink-0" onClick={openCreateGroupModal}>
              <PlusOutlined className="text-sm text-[#666]" />
            </button>
          )}
        </div>

        {/* List */}
        {renderContactList()}
      </div>

      {/* 2. Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#f5f5f5] relative">
        <style>{bubbleStyles}</style>
        {activeChat ? (
          <>
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-6 bg-[#f5f5f5] border-b border-[#e7e7e7]">
              <div className="flex items-center">
                <span className="text-[16px] font-normal text-[#000]">{activeChat.name}</span>
                {activeChat.is_muted && <AudioMutedOutlined className="ml-2 text-gray-400 text-sm" />}
              </div>
              <button className="p-2 hover:bg-[#e7e7e7] rounded text-gray-500" onClick={() => { setIsMembersDrawerOpen(true); fetchMembers(activeChat.id); }}>
                <MoreOutlined className="text-xl" />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-4 space-y-6"
              style={{ backgroundColor: '#f2f2f2' }}
            >
              {isLoadingMore && (
                <div className="flex justify-center py-2">
                  <div className="text-[11px] text-gray-400 flex items-center">
                    <span className="animate-spin mr-2">⏳</span> 加载中...
                  </div>
                </div>
              )}
              {!hasMore && messages.length > 0 && (
                <div className="text-center text-[11px] text-[#ccc] py-2">没有更多了</div>
              )}
              {messages.map((msg, idx) => {
                // System Messages
                if (msg.msg_type === 'system' || msg.sender_id === 0) {
                  return (
                    <div key={idx} className="flex justify-center my-4">
                      <span className="bg-[#dadada] text-white text-[11px] px-2.5 py-0.5 rounded-sm">
                        {msg.content}
                      </span>
                    </div>
                  );
                }

                const isMe = String(msg.sender_id) === String(currentUser?.id);
                const myName = currentUser?.real_name || currentUser?.name;
                const amIMentioned = msg.content && myName && msg.content.includes(`@${myName}`);

                return (
                  <div key={idx} className={`flex items-start chat-message-item ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    {renderAvatar(isMe ? currentUser : { avatar: msg.sender_avatar, name: msg.sender_name }, 40, isMe ? 'ml-3' : 'mr-3')}
                    <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                      {!isMe && <div className="text-[11px] text-[#999] mb-1 ml-1">{msg.sender_name}</div>}
                      <div className={`px-2.5 py-2 rounded-[4px] text-[14px] relative break-words shadow-sm min-h-[36px] flex items-center
                        ${isMe ? 'bg-[#95ec69] text-black chat-bubble-me' : (amIMentioned ? 'bg-amber-100 border border-amber-200 text-amber-900 chat-bubble-other chat-bubble-other-mention' : 'bg-white text-black chat-bubble-other')} 
                        ${msg.msg_type === 'image' ? 'p-1' : ''}`}>
                        {msg.msg_type === 'image' ? (
                          <div className="overflow-hidden rounded-sm">
                            <Image src={msg.file_url} alt="image" className="cursor-pointer" style={{ maxHeight: '200px', maxWidth: '100%' }} />
                          </div>
                        ) : msg.msg_type === 'file' ? (
                          <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center text-[#2e6399]">
                            <FileOutlined className="mr-2 text-xl" /> {msg.content}
                          </a>
                        ) : (
                          <div style={{ wordBreak: 'break-all' }}>{msg.content}</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-[#f5f5f5] border-t border-[#e7e7e7] flex flex-col min-h-[160px]">
              <div className="flex items-center gap-3 py-2 px-6 text-[#555]">
                <Upload beforeUpload={handleFileUpload} showUploadList={false} accept="image/*">
                  <PictureOutlined className="text-xl hover:text-black cursor-pointer" />
                </Upload>
                <Upload beforeUpload={handleFileUpload} showUploadList={false}>
                  <FileOutlined className="text-xl hover:text-black cursor-pointer" />
                </Upload>
              </div>

              <Mentions
                autoSize={{ minRows: 3, maxRows: 6 }}
                className="w-full bg-transparent border-none focus:bg-transparent text-[14px] p-0 px-6 resize-none shadow-none leading-relaxed"
                style={{ border: 'none', boxShadow: 'none' }}
                placeholder=""
                value={inputText}
                onChange={setInputText}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                options={currentGroupMembers.filter(m => m.id !== currentUser?.id).map(m => ({
                  value: m.name,
                  label: m.name,
                  key: m.id
                }))}
              />

              <div className="flex justify-end p-4">
                <button
                  onClick={() => sendMessage()}
                  className="bg-[#e9e9e9] text-[#07c160] border border-[#d1d1d1] px-6 py-1.5 rounded-[4px] text-sm hover:bg-[#d2d2d2] transition-colors"
                >
                  发送(S)
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <TeamOutlined style={{ fontSize: 64, marginBottom: 16, opacity: 0.2 }} />
            <p>选择一个联系人开始聊天</p>
          </div>
        )}
      </div>

      {/* Modals & Drawers */}
      <Drawer
        title={`群成员 (${currentGroupMembers.length})`}
        placement="right"
        onClose={() => setIsMembersDrawerOpen(false)}
        open={isMembersDrawerOpen}
        width={300}
      >
        <div className="mb-6 pb-6 border-b">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">消息免打扰</span>
            <button
              onClick={() => toggleMute(activeChat?.id, activeChat?.is_muted)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${activeChat?.is_muted ? 'bg-green-500' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${activeChat?.is_muted ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        <List
          itemLayout="horizontal"
          dataSource={currentGroupMembers}
          renderItem={item => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar src={item.avatar} icon={<UserOutlined />} />}
                title={item.name}
                description={<div className="text-xs">{item.role === 'admin' && <span className="text-orange-500 mr-2">[群主]</span>}{item.department_name}</div>}
              />
            </List.Item>
          )}
        />
      </Drawer>

      <Modal
        title="发起群聊"
        open={isGroupModalOpen}
        onCancel={() => setIsGroupModalOpen(false)}
        onOk={createGroup}
        okText="创建"
        cancelText="取消"
      >
        <div className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">群名称</label>
            <Input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="请输入群名称" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">选择成员</label>
            <div className="max-h-60 overflow-y-auto border rounded-md p-2">
              {allUsers.map(u => (
                <div key={u.id} onClick={() => { if (selectedMembers.includes(u.id)) { setSelectedMembers(prev => prev.filter(id => id !== u.id)); } else { setSelectedMembers(prev => [...prev, u.id]); } }} className={`flex items-center p-2 rounded cursor-pointer ${selectedMembers.includes(u.id) ? 'bg-green-50' : 'hover:bg-gray-50'}`} >
                  <div className={`w-4 h-4 rounded border mr-2 flex items-center justify-center ${selectedMembers.includes(u.id) ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}> {selectedMembers.includes(u.id) && <div className="w-2 h-2 bg-white rounded-full" />} </div>
                  <Avatar size="small" src={u.avatar} className="mr-2" />
                  <span className="text-sm">{u.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WeChatPage;
