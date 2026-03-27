import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Loader2, LogOut, ArrowLeft, MessageSquare, Heart, Edit2, Trash2, Mail, CheckCircle, X, Edit, Lock, FileText } from 'lucide-react';
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
  contributionCount: number;
}

export default function Profile() {
  const { id } = useParams();
  const { user: currentUser, logout, checkAuth } = useAuth();
  const navigate = useNavigate();
  
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  // Account Management States
  const [isEmailEditing, setIsEmailEditing] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updating, setUpdating] = useState(false);

  // Infinite Scroll States
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const pageSize = 10;

  useEffect(() => {
    loadProfileData();
  }, [id, currentUser]);

  const loadProfileData = async () => {
    setLoading(true);
    setPage(1);
    setHasMore(true);
    try {
      const targetId = id || currentUser?.id;
      if (!targetId) {
        if (!id) navigate('/auth'); 
        return;
      }
      setIsOwnProfile(targetId === currentUser?.id);

      // Always fetch fresh profile data to get the latest contribution count
      const userData = await api.profile.getById(targetId);
      setProfileUser(userData);

      // Fetch Initial Topics
      const topicsData = await api.topics.getFeed(undefined, undefined, targetId, 1, pageSize);
      const fetchedTopics = Array.isArray(topicsData) ? topicsData : topicsData?.topics || [];
      setTopics(fetchedTopics);
      setHasMore(fetchedTopics.length === pageSize);
    } catch (err) {
      console.error('Failed to load profile:', err);
      Swal.fire({ title: 'Error', text: 'User not found or failed to load profile.', icon: 'error', background: 'var(--bg-surface)', color: 'var(--text-primary)' });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchMoreTopics = async () => {
    if (isFetchingMore || !hasMore) return;
    setIsFetchingMore(true);
    const nextPage = page + 1;
    const targetId = id || currentUser?.id;

    try {
      const topicsData = await api.topics.getFeed(undefined, undefined, targetId, nextPage, pageSize);
      const newTopics = Array.isArray(topicsData) ? topicsData : topicsData?.topics || [];
      
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
        window.dispatchEvent(new Event('topicUpdated'));
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

  const handleUpdateEmail = async () => {
    if (!newEmail || newEmail === profileUser?.email) {
      setIsEmailEditing(false);
      return;
    }

    setUpdating(true);
    try {
      await api.profile.updateEmail(newEmail);
      await checkAuth();
      setProfileUser(prev => prev ? { ...prev, email: newEmail } : null);
      setIsEmailEditing(false);
      Swal.fire({ title: 'Success', text: 'Email updated successfully!', icon: 'success', timer: 1500, showConfirmButton: false, background: 'var(--bg-surface)', color: 'var(--text-primary)' });
    } catch (err: any) {
      Swal.fire({ title: 'Update Failed', text: err.response?.data?.message || 'Failed to update email.', icon: 'error', background: 'var(--bg-surface)', color: 'var(--text-primary)' });
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      Swal.fire({ title: 'Mismatch', text: 'New passwords do not match.', icon: 'warning', background: 'var(--bg-surface)', color: 'var(--text-primary)' });
      return;
    }

    setUpdating(true);
    try {
      await api.profile.changePassword({ currentPassword, newPassword });
      setIsPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Swal.fire({ title: 'Success', text: 'Password changed successfully!', icon: 'success', timer: 1500, showConfirmButton: false, background: 'var(--bg-surface)', color: 'var(--text-primary)' });
    } catch (err: any) {
      Swal.fire({ title: 'Failed', text: err.response?.data?.message || 'Failed to change password.', icon: 'error', background: 'var(--bg-surface)', color: 'var(--text-primary)' });
    } finally {
      setUpdating(false);
    }
  };

  const handleExportDocx = () => {
    if (!profileUser) return;
    const exportUrl = api.profile.getExportUrl(profileUser.id);
    window.open(exportUrl, '_blank');
  };

  // Profile Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !isFetchingMore) {
          fetchMoreTopics();
        }
      },
      { threshold: 1.0 }
    );

    const sentinel = document.getElementById('profile-scroll-sentinel');
    if (sentinel) observer.observe(sentinel);

    return () => {
      if (sentinel) observer.unobserve(sentinel);
    };
  }, [hasMore, loading, isFetchingMore, page, id]);

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
          <div className={styles.avatarPlaceholder}>
            {profileUser.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
          
          {/* Upload disabled temporarily */}
        </div>

        <div className={styles.heroInfo}>
          <div className={styles.nameRow}>
            <h1 className={styles.userName}>{profileUser.name}</h1>
            {isOwnProfile && <span className={styles.badge}>Me</span>}
          </div>
          
          <div className={styles.userEmail}>
            <Mail size={16} />
            {isEmailEditing ? (
              <>
                <input 
                  type="email" 
                  className={styles.emailInput} 
                  value={newEmail} 
                  onChange={e => setNewEmail(e.target.value)}
                  autoFocus
                />
                <button className={styles.emailSaveBtn} onClick={handleUpdateEmail} disabled={updating} title="Save">
                  {updating ? <Loader2 className={styles.animateSpin} size={14} /> : <CheckCircle size={14} />}
                </button>
                <button className={styles.emailCancelBtn} onClick={() => setIsEmailEditing(false)} title="Cancel">
                  <X size={14} />
                </button>
              </>
            ) : (
              <>
                <span>{profileUser.email}</span>
                {isOwnProfile && (
                  <button 
                    className={styles.emailEditBtn} 
                    onClick={() => {
                      setNewEmail(profileUser.email);
                      setIsEmailEditing(true);
                    }}
                    title="Change Email"
                  >
                    <Edit size={14} />
                  </button>
                )}
              </>
            )}
          </div>

          <div className={styles.statsRow}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{profileUser.contributionCount}</span>
              <span className={styles.statLabel}>Contributions</span>
            </div>
            
            <button className={styles.exportBtn} onClick={handleExportDocx} title="Export contributions to Word">
              <FileText size={14} />
              Export DOCX
            </button>
          </div>

          {isOwnProfile && (
            <div className={styles.accountActions}>
              <button className={styles.changePasswordBtn} onClick={() => setIsPasswordModalOpen(true)}>
                <Lock size={14} />
                Change Password
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Password Change Modal */}
      {isPasswordModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsPasswordModalOpen(false)}>
          <div className={`glass-panel ${styles.modalContent}`} onClick={e => e.stopPropagation()}>
            <button className={styles.closeModal} onClick={() => setIsPasswordModalOpen(false)}>
              <X size={20} />
            </button>
            <h2 className={styles.modalTitle}>Change Password</h2>
            <p className={styles.modalSubtitle}>Update your security credentials.</p>
            
            <form onSubmit={handleChangePassword}>
              <div className={styles.inputGroup} style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Current Password</label>
                <input 
                  type="password" 
                  className={styles.emailInput}
                  style={{ width: '100%' }}
                  value={currentPassword} 
                  onChange={e => setCurrentPassword(e.target.value)} 
                  required 
                />
              </div>
              <div className={styles.inputGroup} style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>New Password</label>
                <input 
                  type="password" 
                  className={styles.emailInput}
                  style={{ width: '100%' }}
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  required 
                  minLength={6}
                />
              </div>
              <div className={styles.inputGroup} style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Confirm New Password</label>
                <input 
                  type="password" 
                  className={styles.emailInput}
                  style={{ width: '100%' }}
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  required 
                />
              </div>
              <button type="submit" className="cta-button primary" style={{ width: '100%' }} disabled={updating}>
                {updating ? <Loader2 className={styles.animateSpin} size={18} /> : null}
                {updating ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      )}

      <section className={styles.userContent}>
        <h2 className={styles.sectionTitle}>
          {isOwnProfile ? 'Your Contributions' : `${profileUser.name}'s Content`}
        </h2>
        
        {topics.length > 0 ? (
          <>
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

            {/* Profile Infinite Scroll Sentinel */}
            <div id="profile-scroll-sentinel" style={{ padding: '20px', textAlign: 'center', minHeight: '80px' }}>
              {isFetchingMore && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
                  <Loader2 className={styles.animateSpin} size={20} />
                  <span>Loading more contributions...</span>
                </div>
              )}
              {!hasMore && topics.length > 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', opacity: 0.7 }}>
                  No more contributions to show.
                </p>
              )}
            </div>
          </>
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

