import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Heart, MessageSquare, Bookmark, Share2, MoreHorizontal, Loader2, Edit, Trash2 } from 'lucide-react';
import styles from './Feed.module.css';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Swal from 'sweetalert2';
import { formatDistanceToNow } from 'date-fns';

interface Topic {
  id: string;
  title: string;
  content: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  authorName: string | null;
  authorId: string;
  categoryName: string | null;
  tags?: string[];
}

export default function Feed() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q');
  const category = searchParams.get('category');
  const tags = searchParams.getAll('tags');

  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedTopicIds, setExpandedTopicIds] = useState<string[]>([]);

  // Infinite Scroll States
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const pageSize = 10;

  const toggleExpand = (topicId: string) => {
    setExpandedTopicIds(prev =>
      prev.includes(topicId)
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--accent-danger)',
      cancelButtonColor: 'var(--text-muted)',
      confirmButtonText: 'Yes, delete it!',
      background: 'var(--bg-surface)',
      color: 'var(--text-primary)'
    });

    if (result.isConfirmed) {
      try {
        await api.topics.delete(id);
        setTopics(prev => prev.filter(t => t.id !== id));
        Swal.fire({
          title: 'Deleted!',
          text: 'Your post has been deleted.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)'
        });
      } catch (err: any) {
        Swal.fire({
          title: 'Error!',
          text: err.message || 'Failed to delete the topic.',
          icon: 'error',
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)'
        });
      }
    }
  };

  // Reset and Fetch Initial Page
  useEffect(() => {
    const fetchInitialTopics = async () => {
      setLoading(true);
      setError('');
      setPage(1);
      setHasMore(true);
      
      try {
        let data;
        if (searchQuery) {
          data = await api.topics.search(searchQuery, 1, pageSize);
        } else {
          data = await api.topics.getFeed(category || undefined, tags.length > 0 ? tags : undefined, undefined, 1, pageSize);
        }
        
        const fetchedTopics = Array.isArray(data) ? data : data?.topics || [];
        setTopics(fetchedTopics);
        setHasMore(fetchedTopics.length === pageSize);
      } catch (err: any) {
        setError('Failed to load initial feed.');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialTopics();
  }, [searchQuery, category, tags.join(','), user]);

  // Fetch Next Page
  const fetchMoreTopics = async () => {
    if (isFetchingMore || !hasMore) return;

    setIsFetchingMore(true);
    const nextPage = page + 1;
    
    try {
      let data;
      if (searchQuery) {
        data = await api.topics.search(searchQuery, nextPage, pageSize);
      } else {
        data = await api.topics.getFeed(category || undefined, tags.length > 0 ? tags : undefined, undefined, nextPage, pageSize);
      }
      
      const newTopics = Array.isArray(data) ? data : data?.topics || [];
      if (newTopics.length > 0) {
        setTopics(prev => [...prev, ...newTopics]);
        setPage(nextPage);
      }
      
      setHasMore(newTopics.length === pageSize);
    } catch (err) {
      console.error('Failed to fetch more topics:', err);
    } finally {
      setIsFetchingMore(false);
    }
  };

  // Intersection Observer for Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !isFetchingMore) {
          fetchMoreTopics();
        }
      },
      { threshold: 1.0 }
    );

    const sentinel = document.getElementById('scroll-sentinel');
    if (sentinel) observer.observe(sentinel);

    return () => {
      if (sentinel) observer.unobserve(sentinel);
    };
  }, [hasMore, loading, isFetchingMore, page]);

  return (
    <div className={styles.feedContainer}>
      {searchQuery && (
        <div className={styles.searchHeader}>
          <h3>Search results for: <span className={styles.searchQuote}>"{searchQuery}"</span></h3>
          <button className={styles.clearSearchBtn} onClick={() => navigate('/')}>
            Clear Search
          </button>
        </div>
      )}
      
      <div className={styles.feedHeader}>
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${styles.activeTab}`}>
            {searchQuery ? `Search Results for "${searchQuery}"` : 'Latest & Trending Feed'}
          </button>
        </div>
      </div>

      <div className={styles.topicStream}>
        {loading && (
          <div className={styles.loaderContainer}>
            <Loader2 className={styles.spinner} size={32} />
            <p>Loading the developer feed...</p>
          </div>
        )}

        {error && (
          <div className={styles.errorContainer}>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && topics.length === 0 && (
          <div className={styles.emptyContainer}>
            <p>No topics found. Start a new technical discussion!</p>
          </div>
        )}

        {topics.map(topic => (
          <article key={topic.id} className={`glass-panel animate-fade-in ${styles.topicCard}`}>
            <div className={styles.topicHeader}>
              <div 
                className={styles.authorAvatar} 
                onClick={() => navigate(`/profile/${topic.authorId}`)}
                style={{ cursor: 'pointer' }}
                title={`View ${topic.authorName}'s profile`}
              >
                {topic.authorName ? topic.authorName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
              </div>
              <div className={styles.authorMeta}>
                <h4 
                  className={styles.authorName}
                  onClick={() => navigate(`/profile/${topic.authorId}`)}
                  style={{ cursor: 'pointer' }}
                >
                  {topic.authorName || 'Unknown Developer'}
                </h4>
                <p className={styles.authorRole}>
                  {topic.createdAt ? formatDistanceToNow(new Date(topic.createdAt), { addSuffix: true }) : 'Recently'}
                </p>
              </div>

              <div className={styles.headerActions}>
                {user && (user.id || (user as any).Id || (user as any).ID)?.toString().toLowerCase() === topic.authorId?.toString().toLowerCase() && (
                  <div className={styles.ownerActions}>
                    <button className={styles.iconBtn} title="Edit Post" onClick={() => navigate(`/edit/${topic.id}`)}>
                      <Edit size={16} />
                    </button>
                    <button className={`${styles.iconBtn} ${styles.deleteBtn}`} title="Delete Post" onClick={() => handleDelete(topic.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
                <button className={styles.moreButton}>
                  <MoreHorizontal size={20} />
                </button>
              </div>
            </div>

            <div className={styles.topicContent}>
              <h2 className={styles.topicTitle} onClick={() => navigate(`/topic/${topic.id}`)}>
                {topic.title}
              </h2>
              <div
                className={`${styles.topicExcerpt} ${expandedTopicIds.includes(topic.id) ? styles.expanded : ''}`}
                dangerouslySetInnerHTML={{ __html: topic.content }}
              />
              {topic.content && topic.content.length > 200 && (
                <button
                  className={styles.readMoreBtn}
                  onClick={() => toggleExpand(topic.id)}
                >
                  {expandedTopicIds.includes(topic.id) ? 'Show Less' : 'Read More'}
                </button>
              )}
            </div>

            <div className={styles.topicTags}>
              {topic.categoryName && (
                <span className={styles.categoryBadge}>{topic.categoryName}</span>
              )}
              {topic.tags && topic.tags.map(tag => (
                <span key={tag} className={styles.tagBadge}>#{tag}</span>
              ))}
            </div>

            <div className={styles.engagementBar}>
              <div className={styles.actionsBox}>
                <button className={`${styles.actionButton} ${styles.likeButton}`}>
                  <Heart size={18} />
                  <span>{topic.likesCount || 0}</span>
                </button>
                <button className={styles.actionButton}>
                  <MessageSquare size={18} />
                  <span>{topic.commentsCount || 0}</span>
                </button>
              </div>

              <div className={styles.actionsBox}>
                <button className={styles.actionButton}>
                  <Bookmark size={18} />
                </button>
                <button className={styles.actionButton}>
                  <Share2 size={18} />
                </button>
              </div>
            </div>
          </article>
        ))}

        {/* Infinite Scroll Sentinel & Loader */}
        <div id="scroll-sentinel" className={styles.sentinel}>
          {isFetchingMore && (
            <div className={styles.fetchingMoreLoader}>
              <Loader2 className={styles.spinner} size={24} />
              <span>Loading more topics...</span>
            </div>
          )}
          {!hasMore && topics.length > 0 && !loading && (
            <div className={styles.endOfFeed}>
              <p>You've reached the end of the technical stream.</p>
              <span>Stay curious, keep coding.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
