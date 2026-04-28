import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { API_ENDPOINTS } from '../config';
import { useAuth } from './AuthContext';

const ThreadContext = createContext();

export const ThreadProvider = ({ children }) => {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [pendingActions, setPendingActions] = useState({});

  const pendingActionsRef = React.useRef(pendingActions);
  pendingActionsRef.current = pendingActions;

  const fetchThreads = useCallback(async (isBackground = false) => {
    if (!user?.token) return;
    try {
      if (!isBackground) setLoading(true);
      const response = await fetch(API_ENDPOINTS.THREADS, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const raw = Array.isArray(data) ? data : [];
        const normalized = raw.map(t => {
          const tid = t.id || t._id;
          const pending = pendingActionsRef.current[tid] || {};

          const reactions = t.user_reactions || {};
          const reactors = t.reactors || t.likes_list || t.reaction_list || [];
          
          // CRITICAL: Match current user against both token-based reactions and raw reactor lists
          const currentUid = String(user?.employee_id || user?.id || '');
          const userLikedByList = Array.isArray(reactors) && reactors.some(r => {
            const rid = String(r.user_id || r.userId || r.id || r.employee_id || r.EmpID || '');
            return rid && rid === currentUid;
          });

          const userLikedVal = Object.values(reactions).some(v => v === true) || userLikedByList;
          const activeEmojiVal = Object.keys(reactions).find(k => reactions[k] === true) || (userLikedByList ? 'like' : null);
          
          const userBadgeVal = !!(t.userBadge || t.user_has_badged || false);
          const badgeTypeVal = t.badgeType || t.badge_type || null;
          const badgeCountVal = Number(t.badge_count || t.badgeCount || 0);

          const displayReactions = {
            '❤️': Number(t.heart_count || 0) + Number(t.likes_count || 0),
            '👍': Number(t.thumbsup_count || 0),
            '😮': Number(t.shocked_count || 0),
            '😂': Number(t.laugh_count || 0),
            '🔥': Number(t.fire_count || 0),
            '👏': Number(t.clap_count || 0),
            '🎂': Number(t.cake_count || 0)
          };

          const totalLikes = Object.values(displayReactions).reduce((a, b) => a + b, 0);

          return {
            ...t,
            id: tid,
            likes: pending.likes !== undefined ? pending.likes : totalLikes,
            userLiked: pending.userLiked !== undefined ? pending.userLiked : userLikedVal,
            userHasLiked: pending.userLiked !== undefined ? pending.userLiked : userLikedVal,
            activeEmoji: pending.activeEmoji !== undefined ? pending.activeEmoji : activeEmojiVal,
            userHasBadged: pending.userHasBadged !== undefined ? pending.userHasBadged : userBadgeVal,
            badge_type: pending.badgeType !== undefined ? pending.badgeType : badgeTypeVal,
            badgeType: pending.badgeType !== undefined ? pending.badgeType : badgeTypeVal,
            badgeCount: pending.badgeCount !== undefined ? pending.badgeCount : badgeCountVal,
            badge_count: pending.badgeCount !== undefined ? pending.badgeCount : badgeCountVal,
            commentCount: t.commentCount || t.comment_count || 0,
            userName: t.userName || t.user_name || 'Anonymous',
            reactions: displayReactions
          };
        });
        const sorted = normalized.sort((a, b) => 
          new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt)
        );
        setThreads(sorted);
      }
    } catch (error) {
      console.error('Thread Fetch Error:', error);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchUserThreads = async (userId) => {
    if (!user?.token) return [];
    try {
      const response = await fetch(API_ENDPOINTS.THREAD_USER(userId), {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('User Threads Fetch Error:', error);
    }
    return [];
  };

  useEffect(() => {
    if (user?.token) {
      fetchThreads();
      const interval = setInterval(() => fetchThreads(true), 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchThreads]);

  const addPost = async (postData) => {
    if (!user?.token) return false;
    try {
      let body;
      let headers = { 'Authorization': `Bearer ${user.token}` };

      if (postData instanceof FormData) {
        body = postData;
        // Browser sets Content-Type for FormData
      } else {
        headers['Content-Type'] = 'application/json';
        let mediaData = null;
        if (postData.file) {
          mediaData = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(postData.file);
          });
        }
        body = JSON.stringify({
          userId: user?.employee_id || user?.id,
          user_id: user?.employee_id || user?.id,
          employee_id: user?.employee_id || user?.id,
          EmpID: user?.employee_id || user?.id,
          userName: user?.name,
          tagline: postData.tagline || '',
          content: postData.content || '',
          media: mediaData,
          mediaType: postData.mediaType
        });
      }

      const response = await fetch(API_ENDPOINTS.THREADS, {
        method: 'POST',
        headers: headers,
        body: body 
      });

      if (response.ok) {
        fetchThreads(true);
        return true;
      }
    } catch (error) {
      console.error('Post Error:', error);
    }
    return false;
  };
  
  const toggleReaction = async (threadId, userId, emoji = '❤️') => {
    if (!user?.token) return;

    const emojiFieldMap = {
      '❤️': 'heart_count', 'heart': 'heart_count', 'like': 'likes_count',
      '👍': 'thumbsup_count', 'thumbsup': 'thumbsup_count',
      '😮': 'shocked_count', 'shocked': 'shocked_count',
      '😂': 'laugh_count', 'laugh': 'laugh_count',
      '🔥': 'fire_count', 'fire': 'fire_count',
      '👏': 'clap_count', 'clap': 'clap_count',
      '🎂': 'cake_count', 'cake': 'cake_count'
    };

    let updatedPending = {};
    setThreads(prev => prev.map(t => {
      if (t.id === threadId) {
        const currentUserLiked = !!(t.userLiked || t.userHasLiked || t.user_has_liked || t.user_liked);
        const currentActiveEmoji = t.activeEmoji || 'like';
        const isSameEmoji = currentActiveEmoji === emoji;

        // Use the highest available count as the base
        const baseCount = Math.max(
          Number(t.likes || 0),
          Number(t.likeCount || 0),
          Number(t.likes_count || 0),
          Number(t.total_likes || 0)
        );
        
        let newCount = baseCount;
        let newUserLiked = currentUserLiked;
        
        const field = emojiFieldMap[emoji];
        const oldField = emojiFieldMap[currentActiveEmoji];
        
        let specificFields = {};
        if (field) {
            if (currentUserLiked && isSameEmoji) {
                newCount = Math.max(0, newCount - 1);
                newUserLiked = false;
                specificFields[field] = Math.max(0, (t[field] || 0) - 1);
            } else if (currentUserLiked && !isSameEmoji) {
                // Switching emoji
                if (oldField) specificFields[oldField] = Math.max(0, (t[oldField] || 0) - 1);
                specificFields[field] = (t[field] || 0) + 1;
                newUserLiked = true;
            } else {
                newCount = newCount + 1;
                newUserLiked = true;
                specificFields[field] = (t[field] || 0) + 1;
            }
        }

        const newReactions = { ...(t.reactions || {}) };
        if (field) {
            const displayEmoji = (emoji === 'like' || emoji === 'heart') ? '❤️' : emoji;
            if (currentUserLiked && isSameEmoji) {
                newReactions[displayEmoji] = Math.max(0, (newReactions[displayEmoji] || 0) - 1);
            } else if (currentUserLiked && !isSameEmoji) {
                const oldDisplayEmoji = (currentActiveEmoji === 'like' || currentActiveEmoji === 'heart') ? '❤️' : currentActiveEmoji;
                newReactions[oldDisplayEmoji] = Math.max(0, (newReactions[oldDisplayEmoji] || 0) - 1);
                newReactions[displayEmoji] = (newReactions[displayEmoji] || 0) + 1;
            } else {
                newReactions[displayEmoji] = (newReactions[displayEmoji] || 0) + 1;
            }
        }

        updatedPending = { 
            likes: newCount, 
            userLiked: newUserLiked, 
            activeEmoji: newUserLiked ? emoji : null, 
            ...specificFields,
            reactions: newReactions 
        };
        return { 
            ...t, 
            ...updatedPending,
            userLiked: newUserLiked,
            userHasLiked: newUserLiked,
            likes: newCount,
            reactions: newReactions
        };
      }
      return t;
    }));

    setPendingActions(prev => ({ ...prev, [threadId]: { ...prev[threadId], ...updatedPending } }));

    try {
      await fetch(API_ENDPOINTS.THREAD_REACT(threadId), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}` 
        },
        body: JSON.stringify({ 
          userId: user?.employee_id || user?.id,
          user_id: user?.employee_id || user?.id,
          employee_id: user?.employee_id || user?.id,
          EmpID: user?.employee_id || user?.id,
          userName: user?.name,
          emoji, 
          reactionType: emoji, 
          reaction_type: emoji,
          type: emoji,
          emoji_icon: emoji === 'like' ? '❤️' : emoji
        })
      });
      setTimeout(() => fetchThreads(true), 1000);
      setTimeout(() => {
        setPendingActions(prev => {
            const next = { ...prev };
            delete next[threadId];
            return next;
        });
      }, 15000);
    } catch (error) {
      console.error('Reaction Error:', error);
      fetchThreads(true); 
    }
  };

  const addComment = async (threadId, content) => {
    if (!user?.token || !content.trim()) return false;
    try {
      const response = await fetch(API_ENDPOINTS.THREAD_COMMENT(threadId), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}` 
        },
        body: JSON.stringify({ 
          userId: user?.id || user?.employee_id,
          user_id: user?.id || user?.employee_id,
          userName: user?.name,
          content
        })
      });
      if (response.ok) {
        fetchThreads(true);
        return true;
      }
    } catch (error) {
      console.error('Comment Error:', error);
    }
    return false;
  };

  const toggleBadge = async (threadId, userId, badgeType = 'Top Player') => {
    if (!user?.token) return;
    
    let newCount = 0;
    setThreads(prev => prev.map(t => {
      if (t.id === threadId) {
          const isCurrentlyBadged = t.badgeType === badgeType || t.badge_type === badgeType;
          newCount = isCurrentlyBadged ? Math.max(0, (t.badgeCount || t.badge_count || 0) - 1) : (t.badgeCount || t.badge_count || 0) + 1;
          return { 
              ...t, 
              badgeType: isCurrentlyBadged ? null : badgeType,
              badge_type: isCurrentlyBadged ? null : badgeType,
              badgeCount: newCount,
              badge_count: newCount,
              userHasBadged: !isCurrentlyBadged
          };
      }
      return t;
    }));
    setPendingActions(prev => ({ ...prev, [threadId]: { ...prev[threadId], badgeType, badgeCount: newCount } }));

    try {
      await fetch(API_ENDPOINTS.THREAD_BADGE(threadId), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}` 
        },
        body: JSON.stringify({ 
        userId: user?.id || user?.employee_id,
        user_id: user?.id || user?.employee_id,
        badge: badgeType, 
        type: badgeType, 
        badge_count: newCount,
        badgeCount: newCount
      })
      });
      fetchThreads(true);
      setTimeout(() => {
        setPendingActions(prev => {
            const next = { ...prev };
            delete next[threadId];
            return next;
        });
      }, 15000);
    } catch (error) {
      console.error('Badge Error:', error);
      fetchThreads(true);
    }
  };

  const updatePost = async (threadId, content) => {
    if (!user?.token || !content.trim()) return;
    try {
      const response = await fetch(API_ENDPOINTS.THREAD_UPDATE(threadId), {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}` 
        },
        body: JSON.stringify({ content })
      });
      if (response.ok) {
        fetchThreads(true);
        return true;
      }
    } catch (error) {
      console.error('Update Error:', error);
    }
    return false;
  };

  const deleteThread = async (threadId) => {
    if (!user?.token) return;
    try {
      const response = await fetch(API_ENDPOINTS.THREAD_DELETE(threadId), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (response.ok) {
        fetchThreads();
        return true;
      }
    } catch (error) {
      console.error('Delete Error:', error);
    }
    return false;
  };

  const fetchComments = async (threadId) => {
    if (!user?.token) return [];
    try {
      const response = await fetch(API_ENDPOINTS.THREAD_COMMENTS(threadId), {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Fetch Comments Error:', error);
    }
    return [];
  };

  return (
    <ThreadContext.Provider value={{ 
      threads, 
      loading: initialLoading, 
      addPost, 
      deletePost: deleteThread,
      updatePost,
      toggleReaction, 
      toggleBadge,
      addComment, 
      deleteThread, 
      fetchComments,
      fetchUserThreads,
      refresh: fetchThreads 
    }}>
      {children}
    </ThreadContext.Provider>
  );
};

export const useThread = () => useContext(ThreadContext);
