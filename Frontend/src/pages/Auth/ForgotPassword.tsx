import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { api } from '../../services/api';
import styles from './AuthPage.module.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.auth.forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      console.error('Forgot password request failed:', err);
      // We show success even on error to prevent email harvesting, 
      // but usually the backend handles this.
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className={styles.container}>
        <div className={`glass-panel ${styles.authCard} animate-fade-in`}>
          <div className={styles.successIconWrapper}>
            <CheckCircle size={48} color="var(--accent-success)" />
          </div>
          <h2 className={styles.title}>Check your email</h2>
          <p className={styles.subtitle}>
            If an account exists for {email}, we've sent a password reset link.
          </p>
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <Link to="/auth" className={styles.toggleBtn}>
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={`glass-panel ${styles.authCard} animate-fade-in`}>
        <button className={styles.backButton} onClick={() => navigate('/auth')}>
          <ArrowLeft size={18} />
          Back
        </button>
        
        <h2 className={styles.title}>Reset Password</h2>
        <p className={styles.subtitle}>
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Email Address</label>
            <div className={styles.inputWithIcon}>
              <Mail size={18} className={styles.inputIcon} />
              <input 
                type="email" 
                placeholder="developer@example.com"
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                autoFocus
              />
            </div>
          </div>
          
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <Loader2 className={styles.animateSpin} /> : <Mail size={18} />}
            {loading ? 'Sending Link...' : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  );
}
