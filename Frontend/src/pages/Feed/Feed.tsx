import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Heart, MessageSquare, Bookmark, Share2, MoreHorizontal, Loader2 } from 'lucide-react';
import styles from './Feed.module.css';
import { api } from '../../services/api';
import { formatDistanceToNow } from 'date-fns';

interface Topic {
  id: string;
  title: string;
  content: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  authorName: string | null;
  categoryName: string | null;
  tags?: string[];
}

export default function Feed() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q');
  
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTopics = async () => {
      setLoading(true);
      setError('');
      try {
        let data;
        if (searchQuery) {
          data = await api.topics.search(searchQuery);
        } else {
          data = await api.topics.getFeed();
        }
        setTopics(data || []);
      } catch (err) {
        setError('Failed to load topics! Please make sure your backend API is running in Visual Studio.');
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, [searchQuery]);

  return (
    <div className={styles.feedContainer}>
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

        {!loading && topics.map(topic => (
          <article key={topic.id} className={`glass-panel animate-fade-in ${styles.topicCard}`}>
            <div className={styles.topicHeader}>
              <div className={styles.authorAvatar}>
                {topic.authorName ? topic.authorName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className={styles.authorMeta}>
                <h4 className={styles.authorName}>{topic.authorName || 'Unknown Developer'}</h4>
                <p className={styles.authorRole}>
                  {topic.createdAt ? formatDistanceToNow(new Date(topic.createdAt), { addSuffix: true }) : 'Recently'}
                </p>
              </div>
              <button className={styles.moreButton}>
                <MoreHorizontal size={20} />
              </button>
            </div>

            <div className={styles.topicContent}>
              <h2 className={styles.topicTitle}>{topic.title}</h2>
              <div 
                className={styles.topicExcerpt} 
                dangerouslySetInnerHTML={{ __html: topic.content }}
              />
            </div>

            <div className={styles.topicTags}>
              {topic.categoryName && (
                <span className={styles.categoryBadge}>{topic.categoryName}</span>
              )}
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
      </div>
    </div>
  );
}
