import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Camera, Loader2, LogOut, ArrowLeft, MessageSquare, Heart, Edit2, Trash2, Mail } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { formatDistanceToNow } from 'date-fns';
import styles from './Profile.module.css';

interface Topic {
  id: string;
  title: string;
  content: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  categoryName: string | null;
  tags?: string[];
}

interface ProfileUser {
  id: string;
  name: string;
  email: string;
  profileImage: string | null;
}

export default function Profile() {
  const { id } = useParams();
  const { user: currentUser, logout, checkAuth } = useAuth();
  const navigate = useNavigate();
  
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfileData();
  }, [id, currentUser]);

  const loadProfileData = async () => {
    setLoading(true);
    try {
      // Determine if we are viewing current user or someone else
      const targetId = id || currentUser?.id;
      
      if (!targetId) {
        if (!id) navigate('/auth'); 
        return;
      }

      setIsOwnProfile(targetId === currentUser?.id);

      // Fetch User Details
      if (targetId === currentUser?.id) {
        // Use local auth data for performance if it's "me"
        setProfileUser({
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          profileImage: currentUser.profileimage || null
        });
      } else {
        const userData = await api.profile.getById(targetId);
        setProfileUser(userData);
      }

      // Fetch User Topics
      const topicsData = await api.topics.getFeed(undefined, undefined, targetId);
      setTopics(Array.isArray(topicsData) ? topicsData : topicsData?.topics || []);

    } catch (err) {
      console.error('Failed to load profile:', err);
      Swal.fire({ 
        title: 'Error', 
        text: 'User not found or failed to load profile.', 
        icon: 'error',
        background: 'var(--bg-surface)',
        color: 'var(--text-primary)'
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      Swal.fire({ title: 'File Too Large', text: 'Please select an image smaller than 2MB.', icon: 'warning', background: 'var(--bg-surface)', color: 'var(--text-primary)' });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      await api.profile.uploadImage(formData);
      await checkAuth(); 
      Swal.fire({ title: 'Success', text: 'Profile picture updated successfully!', icon: 'success', timer: 1500, showConfirmButton: false, background: 'var(--bg-surface)', color: 'var(--text-primary)' });
    } catch (err) {
      Swal.fire({ title: 'Upload Failed', text: 'There was an error updating your profile picture.', icon: 'error', background: 'var(--bg-surface)', color: 'var(--text-primary)' });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteTopic = async (topicId: string, title: string) => {
    const result = await Swal.fire({
      title: 'Delete Topic?',
      text: `Are you sure you want to delete "${title}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      background: 'var(--bg-surface)',
      color: 'var(--text-primary)',
      confirmButtonColor: '#ef4444'
    });

    if (result.isConfirmed) {
      try {
        await api.topics.delete(topicId);
        setTopics(topics.filter(t => t.id !== topicId));
        Swal.fire({ title: 'Deleted!', icon: 'success', timer: 1000, showConfirmButton: false, background: 'var(--bg-surface)', color: 'var(--text-primary)' });
      } catch (err) {
        Swal.fire({ title: 'Error', text: 'Failed to delete topic.', icon: 'error', background: 'var(--bg-surface)', color: 'var(--text-primary)' });
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getProfileUrl = () => {
    if (profileUser?.profileImage) {
      return `${import.meta.env.VITE_API_URL.replace('/api', '')}/profile-images/${profileUser.profileImage}`;
    }
    return null;
  };

  if (loading && !profileUser) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.animateSpin} size={48} />
      </div>
    );
  }

  if (!profileUser) return null;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
          Back
        </button>
        {isOwnProfile && (
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <LogOut size={16} />
            Sign Out
          </button>
        )}
      </header>

      <section className={`glass-panel ${styles.profileHero}`}>
        <div className={styles.avatarWrapper}>
          {getProfileUrl() ? (
            <img src={getProfileUrl()!} alt="Profile" className={styles.avatarImage} />
          ) : (
            <div className={styles.avatarPlaceholder}>
              {profileUser.name?.charAt(0).toUpperCase()}
            </div>
          )}
          
          {isOwnProfile && (
            <>
              <label className={styles.uploadBtn} htmlFor="profile-upload" title="Change Profile Picture">
                {uploading ? <Loader2 className={styles.animateSpin} size={16} color="white" /> : <Camera size={16} color="white" />}
              </label>
              <input 
                type="file" 
                id="profile-upload" 
                accept="image/*" 
                onChange={handleFileChange} 
                className={styles.hiddenInput}
                disabled={uploading}
              />
            </>
          )}
        </div>

        <div className={styles.heroInfo}>
          <div className={styles.nameRow}>
            <h1 className={styles.userName}>{profileUser.name}</h1>
            {isOwnProfile && <span className={styles.badge}>Me</span>}
          </div>
          <p className={styles.userEmail}>
            <Mail size={14} /> {profileUser.email}
          </p>
          <div className={styles.statsRow}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{topics.length}</span>
              <span className={styles.statLabel}>Contributions</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.userContent}>
        <h2 className={styles.sectionTitle}>
          {isOwnProfile ? 'Your Contributions' : `${profileUser.name}'s Content`}
        </h2>
        
        {topics.length > 0 ? (
          <div className={styles.topicGrid}>
            {topics.map(topic => (
              <div key={topic.id} className={`glass-panel ${styles.topicCard}`}>
                <div className={styles.topicHeader}>
                  <span className={styles.topicCategory}>{topic.categoryName || 'General'}</span>
                  {isOwnProfile && (
                    <div className={styles.topicActions}>
                      <button onClick={() => navigate(`/edit/${topic.id}`)} title="Edit Topic">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDeleteTopic(topic.id, topic.title)} title="Delete Topic" className={styles.deleteBtn}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
                
                <h3 className={styles.topicTitle} onClick={() => navigate(`/topic/${topic.id}`)}>
                  {topic.title}
                </h3>
                
                <div className={styles.topicTags}>
                  {topic.tags?.slice(0, 3).map(tag => (
                    <span key={tag} className={styles.tag}>#{tag}</span>
                  ))}
                  {topic.tags && topic.tags.length > 3 && <span className={styles.moreTags}>+{topic.tags.length - 3}</span>}
                </div>

                <div className={styles.topicFooter}>
                  <span className={styles.topicDate}>
                    {formatDistanceToNow(new Date(topic.createdAt), { addSuffix: true })}
                  </span>
                  <div className={styles.topicStats}>
                    <div className={styles.stat}><Heart size={14} /> {topic.likesCount}</div>
                    <div className={styles.stat}><MessageSquare size={14} /> {topic.commentsCount}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>{isOwnProfile ? "You haven't created any topics yet." : "No contributions yet."}</p>
            {isOwnProfile && <button onClick={() => navigate('/create')} className={styles.createFirstBtn}>Create your first topic</button>}
          </div>
        )}
      </section>
    </div>
  );
}
