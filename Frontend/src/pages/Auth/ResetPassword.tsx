import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '../../services/api';
import styles from './AuthPage.module.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      Swal.fire({ title: 'Mismatch', text: 'Passwords do not match.', icon: 'warning', background: 'var(--bg-surface)', color: 'var(--text-primary)' });
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.auth.resetPassword({ token, newPassword });
      setSuccess(true);
      Swal.fire({
        title: 'Success!',
        text: 'Your password has been reset successfully.',
        icon: 'success',
        timer: 3000,
        showConfirmButton: false,
        background: 'var(--bg-surface)',
        color: 'var(--text-primary)'
      });
      setTimeout(() => navigate('/auth'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may be expired.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.container}>
        <div className={`glass-panel ${styles.authCard} animate-fade-in`}>
          <div className={styles.successIconWrapper}>
            <CheckCircle size={48} color="var(--accent-success)" />
          </div>
          <h2 className={styles.title}>Password Reset!</h2>
          <p className={styles.subtitle}>
            Your password has been updated. You are being redirected to sign in...
          </p>
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <Link to="/auth" className={styles.toggleBtn}>
              Go to Sign In Now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={`glass-panel ${styles.authCard} animate-fade-in`}>
        <h2 className={styles.title}>Set New Password</h2>
        <p className={styles.subtitle}>
          Please enter and confirm your new strong password.
        </p>

        {error ? (
          <div className={styles.errorState}>
            <AlertCircle size={40} color="var(--accent-danger)" />
            <p>{error}</p>
            <Link to="/forgot-password" className={styles.toggleBtn} style={{ marginTop: '15px' }}>
              Request new link
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label>New Password</label>
              <div className={styles.inputWithIcon}>
                <Lock size={18} className={styles.inputIcon} />
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  required 
                  minLength={6}
                  placeholder="At least 6 characters"
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Confirm Password</label>
              <div className={styles.inputWithIcon}>
                <Lock size={18} className={styles.inputIcon} />
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  required 
                />
              </div>
            </div>
            
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? <Loader2 className={styles.animateSpin} /> : <Lock size={18} />}
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
