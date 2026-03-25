import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Heart, Bookmark, Share2, Loader2, Calendar, User as UserIcon } from 'lucide-react';
import { api } from '../../services/api';
import { formatDistanceToNow } from 'date-fns';
import styles from './TopicDetail.module.css';

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

export default function TopicDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTopic = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await api.topics.getById(id);
        setTopic(data);
      } catch (err: any) {
        console.error('Failed to fetch topic:', err);
        setError('Failed to load topic details.');
      } finally {
        setLoading(false);
      }
    };

    fetchTopic();
  }, [id]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={40} />
        <p>Loading topic...</p>
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className={styles.errorContainer}>
        <h2>Oops!</h2>
        <p>{error || 'Topic not found.'}</p>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={() => navigate(-1)}>
        <ArrowLeft size={18} />
        Back to Feed
      </button>

      <article className={`glass-panel animate-fade-in ${styles.article}`}>
        <header className={styles.header}>
          <div className={styles.meta}>
            <div className={styles.authorInfo}>
              <div
                className={styles.avatar}
                onClick={() => navigate(`/profile/${topic.authorId}`)}
                style={{ cursor: 'pointer' }}
              >
                {topic.authorName ? topic.authorName.split(' ').map(n => n[0]).join('').toUpperCase() : <UserIcon size={20} />}
              </div>
              <div className={styles.authorText}>
                <span
                  className={styles.authorName}
                  onClick={() => navigate(`/profile/${topic.authorId}`)}
                  style={{ cursor: 'pointer' }}
                >
                  {topic.authorName || 'Unknown Developer'}
                </span>
                <span className={styles.date}>
                  <Calendar size={12} />
                  {topic.createdAt ? formatDistanceToNow(new Date(topic.createdAt), { addSuffix: true }) : 'Recently'}
                </span>
              </div>
            </div>
            {topic.categoryName && (
              <span className={styles.categoryBadge}>{topic.categoryName}</span>
            )}
          </div>
          <h1 className={styles.title}>{topic.title}</h1>
        </header>

        <div className={styles.tags}>
          {topic.tags && topic.tags.map(tag => (
            <span key={tag} className={styles.tagBadge}>#{tag}</span>
          ))}
        </div>

        <div 
          className={styles.content} 
          dangerouslySetInnerHTML={{ __html: topic.content }} 
        />

        <footer className={styles.footer}>
          <div className={styles.engagement}>
            <button className={styles.actionBtn}>
              <Heart size={20} />
              <span>{topic.likesCount}</span>
            </button>
            <button className={styles.actionBtn}>
              <MessageSquare size={20} />
              <span>{topic.commentsCount}</span>
            </button>
          </div>
          <div className={styles.actions}>
            <button className={styles.actionBtn}><Bookmark size={20} /></button>
            <button className={styles.actionBtn}><Share2 size={20} /></button>
          </div>
        </footer>
      </article>

      {/* Placeholder for comments section in future */}
      <section className={styles.commentsPlaceholder}>
        <div className={styles.commentsHeader}>
          <MessageSquare size={20} />
          <h3>Discussion</h3>
        </div>
        <div className={styles.comingSoon}>
          <p>Full conversation thread coming soon!</p>
        </div>
      </section>
    </div>
  );
}
