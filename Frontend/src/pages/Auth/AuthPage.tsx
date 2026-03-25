import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import styles from './AuthPage.module.css';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const data: any = await api.auth.login({ email, password });
        login(data);
      } else {
        const data: any = await api.auth.register({ name, email, password });
        login(data);
      }
      navigate('/');
    } catch (err: any) {
      Swal.fire({
        title: 'Authentication Failed',
        text: err.message || 'Check your credentials and try again.',
        icon: 'error',
        background: 'var(--bg-surface)',
        color: 'var(--text-primary)'
      });
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className={styles.container}>
      <div className={`glass-panel ${styles.authCard}`}>
        <h2 className={styles.title}>{isLogin ? 'Welcome Back' : 'Create an Account'}</h2>
        <p className={styles.subtitle}>
          {isLogin ? 'Sign in to jump back into the discussion.' : 'Join the developer community today.'}
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {!isLogin && (
            <div className={styles.inputGroup}>
              <label>Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required />
            </div>
          )}
          <div className={styles.inputGroup}>
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className={styles.inputGroup}>
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          
          {isLogin && (
            <div className={styles.forgotPasswordContainer}>
              <button 
                type="button" 
                className={styles.forgotPasswordBtn}
                onClick={() => navigate('/forgot-password')}
              >
                Forgot Password?
              </button>
            </div>
          )}
          
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <Loader2 className={styles.animateSpin} /> : isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <p className={styles.toggleText}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setIsLogin(!isLogin)} className={styles.toggleBtn}>
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
}
