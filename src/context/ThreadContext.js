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
      const uId = user?.id || user?.employee_id;
      const url = `${API_ENDPOINTS.THREADS}${uId ? `?userId=${uId}` : ''}`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const raw = Array.isArray(data) ? data : [];
        const normalized = await Promise.all(raw.map(async t => {
          const tid = t.id || t._id;
          const pending = pendingActionsRef.current[tid] || {};

          let badgeCountVal = t.badge_count || t.badgeCount || 0;
          let userLikedVal = !!t.userLiked || !!t.user_liked || !!t.userHasLiked || false;
          let userBadgeVal = !!t.userBadge || !!t.user_has_badged || false;
          let badgeTypeVal = t.badgeType || t.badge_type || null;

          // Emoji Mapping for dedicated DB columns
          const emojiFieldMap = {
            '❤️': 'heart_count', 'heart': 'heart_count',
            '👍': 'thumbsup_count', 'thumbsup': 'thumbsup_count',
            '😮': 'shocked_count', 'shocked': 'shocked_count',
            '😂': 'laugh_count', 'laugh': 'laugh_count',
            '🔥': 'fire_count', 'fire': 'fire_count',
            '👏': 'clap_count', 'clap': 'clap_count',
            '🎂': 'cake_count', 'cake': 'cake_count',
            'like': 'likes_count'
          };
          
          let reactionCounts = {
            likes_count: Number(t.likes_count || 0),
            heart_count: Number(t.heart_count || 0),
            thumbsup_count: Number(t.thumbsup_count || 0),
            shocked_count: Number(t.shocked_count || 0),
            laugh_count: Number(t.laugh_count || 0),
            fire_count: Number(t.fire_count || 0),
            clap_count: Number(t.clap_count || 0),
            cake_count: Number(t.cake_count || 0)
          };
          // Start with the aggregate likes if available
          reactionCounts.likes = Number(t.likes || t.likeCount || t.likes_count || 0);

          // Hydrate from DB explicitly
          try {
            const rRes = await fetch(API_ENDPOINTS.THREAD_REACTORS(tid), {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if (rRes.ok) {
                const rData = await rRes.json();
                const reactors = Array.isArray(rData) ? rData : (rData.users || rData.reactors || rData.data || rData.reactions || rData.reactionUsers || rData.value || []);
                let ul = false; let ub = false; let bt = null;
                
                const currentIdStr = String(user?.id || '');
                const currentIdNum = Number(user?.id || 0);
                const currentEmpIdStr = String(user?.employee_id || '');
                const currentEmailStr = String(user?.email || '').toLowerCase();
                const currentNameStr = String(user?.name || '').toLowerCase();

                const hydratedCounts = { 
                    likes_count: 0,
                    heart_count: 0, 
                    thumbsup_count: 0, 
                    shocked_count: 0, 
                    laugh_count: 0, 
                    fire_count: 0, 
                    clap_count: 0, 
                    cake_count: 0 
                };

                reactors.forEach(r => {
                    const rawType = r.reaction_type || r.reactionType || r.type || r.emoji || r.reaction || r.value || r.badge;
                    if (!rawType) return;
                    const rType = String(rawType).toLowerCase();
                    const field = emojiFieldMap[rawType] || emojiFieldMap[rType];
                    if (field) hydratedCounts[field]++;

                    const rUid = String(r.user_id || r.userId || r.employee_id || r.emp_id || r.id || r.u_id || r.uid || r.EmpID || '');
                    const rEmail = String(r.user_email || r.userEmail || r.email || '').toLowerCase();
                    const rName = String(r.user_name || r.userName || r.name || r.employee_name || '').toLowerCase();
                    
                    const isMatch = (rUid && currentIdStr && rUid === currentIdStr) || 
                                    (Number(rUid) > 0 && currentIdNum > 0 && Number(rUid) === currentIdNum) ||
                                    (rUid && currentEmpIdStr && rUid === currentEmpIdStr) ||
                                    (rEmail && currentEmailStr && rEmail === currentEmailStr) ||
                                    (rName && currentNameStr && rName === currentNameStr);

                    if (field) {
                        if (isMatch) ul = true;
                    } else if (rType === 'badge' || rType.includes('badge')) {
                        if (isMatch) { ub = true; bt = rawType; }
                    }
                });
                
                userLikedVal = ul || (!!t.userLiked || !!t.user_liked || !!t.userHasLiked);
                userBadgeVal = ub || (!!t.user_has_badged || false);
                if (bt) badgeTypeVal = bt;
                
                Object.keys(hydratedCounts).forEach(f => {
                    reactionCounts[f] = Math.max(reactionCounts[f] || 0, hydratedCounts[f]);
                });
                
                // Recalculate total likes based on hydrated values, but ensure it doesn't drop below the initial aggregate
                const calculatedTotal = (reactionCounts.heart_count || 0) + (reactionCounts.thumbsup_count || 0) + (reactionCounts.shocked_count || 0) + (reactionCounts.laugh_count || 0) + (reactionCounts.fire_count || 0) + (reactionCounts.clap_count || 0) + (reactionCounts.cake_count || 0) + (reactionCounts.likes_count || 0);
                reactionCounts.likes = Math.max(reactionCounts.likes, calculatedTotal);
            }
          } catch (e) {
             console.warn("Hydration failed for HR thread", tid, e);
          }

          return {
            ...t,
            ...reactionCounts,
            id: tid,
            likes: pending.likes !== undefined ? pending.likes : reactionCounts.likes,
            userId: t.user_id || t.userId,
            user_id: t.user_id || t.userId,
            userLiked: pending.userLiked !== undefined ? pending.userLiked : userLikedVal,
            userHasBadged: pending.userHasBadged !== undefined ? pending.userHasBadged : userBadgeVal,
            badge_type: pending.badgeType !== undefined ? pending.badgeType : badgeTypeVal,
            badgeType: pending.badgeType !== undefined ? pending.badgeType : badgeTypeVal,
            badgeCount: pending.badgeCount !== undefined ? pending.badgeCount : badgeCountVal,
            badge_count: pending.badgeCount !== undefined ? pending.badgeCount : badgeCountVal,
            commentCount: t.commentCount || t.comment_count || 0,
            comment_count: t.commentCount || t.comment_count || 0,
            userName: t.userName || t.user_name || 'Anonymous',
            userRole: t.userRole || t.user_role || 'Member',
            reactions: {
              '❤️': (reactionCounts.heart_count || 0) + (reactionCounts.likes_count || 0),
              '👍': reactionCounts.thumbsup_count || 0,
              '😮': reactionCounts.shocked_count || 0,
              '😂': reactionCounts.laugh_count || 0,
              '🔥': reactionCounts.fire_count || 0,
              '👏': reactionCounts.clap_count || 0,
              '🎂': reactionCounts.cake_count || 0
            }
          };
        }));
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
          userId: Number(postData.userId || postData.user_id),
          user_id: Number(postData.userId || postData.user_id),
          userName: postData.user || postData.user_name,
          role: postData.role || postData.user_role || 'EMPLOYEE',
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
        const currentUserLiked = t.userLiked || false;
        const currentActiveEmoji = t.activeEmoji || '❤️';
        const isSameEmoji = currentActiveEmoji === emoji;

        let newCount = t.likes || 0;
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
      const uId = user?.id || user?.employee_id || userId;
      await fetch(API_ENDPOINTS.THREAD_REACT(threadId), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}` 
        },
        body: JSON.stringify({ 
        emoji, 
        reactionType: emoji, 
        reaction_type: emoji,
        type: emoji,
        userId: uId, 
        user_id: uId,
        employee_id: uId,
        EmpID: uId,
        user_name: user?.name,
        userName: user?.name,
        employee_name: user?.name
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
      console.error('Reaction Error:', error);
      fetchThreads(true); 
    }
  };

  const addComment = async (threadId, content) => {
    if (!user?.token || !content.trim()) return false;
    try {
      const uId = user?.id || user?.employee_id || user?.EmpID;
      const response = await fetch(API_ENDPOINTS.THREAD_COMMENT(threadId), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}` 
        },
        body: JSON.stringify({ 
          content, 
          userId: uId, 
          user_id: uId,
          userName: user?.name,
          user_name: user?.name,
          employee_name: user?.name
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
      const uId = user?.id || user?.employee_id || userId;
      await fetch(API_ENDPOINTS.THREAD_BADGE(threadId), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}` 
        },
        body: JSON.stringify({ 
        badge: badgeType, 
        type: badgeType, 
        userId: uId, 
        user_id: uId,
        badge_count: newCount,
        badgeCount: newCount,
        employee_id: uId,
        EmpID: uId
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
