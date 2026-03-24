import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Camera, Loader2, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import styles from './Profile.module.css';

export default function Profile() {
  const { user, logout, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      Swal.fire('File Too Large', 'Please select an image smaller than 2MB.', 'warning');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      await api.profile.uploadImage(formData);
      await checkAuth(); 
      Swal.fire('Success', 'Profile picture updated successfully!', 'success');
    } catch (err) {
      Swal.fire('Upload Failed', 'There was an error updating your profile picture.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getProfileUrl = () => {
    if (user.profileimage) {
      return `${import.meta.env.VITE_API_URL.replace('/api', '')}/profile-images/${user.profileimage}`;
    }
    return null;
  };

  return (
    <div className={styles.container}>
      <div className={`glass-panel ${styles.profileCard}`}>
        <div className={styles.avatarSection}>
          <div className={styles.avatarWrapper}>
            {getProfileUrl() ? (
              <img src={getProfileUrl()!} alt="Profile" className={styles.avatarImage} />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            
            <label className={styles.uploadBtn} htmlFor="profile-upload">
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
          </div>
        </div>

        <div className={styles.userInfo}>
          <h2 className={styles.userName}>{user.name}</h2>
          <p className={styles.userEmail}>{user.email}</p>
          <div className={styles.badge}>Developer Account</div>
        </div>

        <button onClick={handleLogout} className={styles.logoutBtn}>
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
