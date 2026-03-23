import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';
import Select from 'react-select';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { api } from '../../services/api';
import styles from './CreateTopic.module.css';

const categoryOptions = [
  { value: '1', label: 'Backend' },
  { value: '2', label: 'Frontend' },
  { value: '3', label: 'Database' },
  { value: '4', label: 'System Design' },
  { value: '5', label: 'DevOps' },
  { value: '6', label: 'HR Behavioral' }
];

const selectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    background: 'var(--bg-surface)',
    borderColor: state.isFocused ? 'var(--accent-primary)' : 'var(--border-light)',
    boxShadow: state.isFocused ? 'var(--shadow-glow)' : 'none',
    color: 'var(--text-primary)',
    padding: '2px',
    borderRadius: 'var(--radius-md)'
  }),
  menu: (base: any) => ({
    ...base,
    background: 'var(--bg-surface-hover)',
    border: '1px solid var(--border-light)'
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isFocused ? 'var(--bg-surface)' : 'transparent',
    color: 'var(--text-primary)',
    cursor: 'pointer'
  }),
  singleValue: (base: any) => ({
    ...base,
    color: 'var(--text-primary)'
  }),
  input: (base: any) => ({
    ...base,
    color: 'var(--text-primary)'
  })
};

export default function CreateTopic() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('1'); 
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    
    setLoading(true);
    try {
      await api.topics.create({ title, content, categoryId: parseInt(categoryId) });
      navigate('/');
    } catch (err) {
      Swal.fire({
        title: 'API Not Ready',
        text: 'Connecting new topics to the .NET database requires the Create API to be built next! Redirecting to feed for now.',
        icon: 'info',
        background: 'var(--bg-surface)',
        color: 'var(--text-primary)',
        confirmButtonColor: 'var(--accent-primary)'
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Start a new technical discussion</h1>
      <form className={`glass-panel ${styles.form}`} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label>Title</label>
          <input 
            type="text" 
            placeholder="What's on your mind? e.g. Why I switched to PostgreSQL"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            autoFocus
          />
        </div>
        
        <div className={styles.formGroup}>
          <label>Target Category</label>
          <Select 
            options={categoryOptions}
            styles={selectStyles}
            value={categoryOptions.find(o => o.value === categoryId)}
            onChange={(option: any) => setCategoryId(option?.value || '1')}
          />
        </div>

        <div className={styles.formGroup}>
          <label>Discussion Content</label>
          <div className={styles.editorWrapper}>
            <CKEditor
              editor={ClassicEditor}
              data={content}
              config={{
                toolbar: ['heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', '|', 'blockQuote', 'insertTable', 'undo', 'redo']
              }}
              onChange={(_: any, editor: any) => {
                const data = editor.getData();
                setContent(data);
              }}
            />
          </div>
        </div>

        <div className={styles.formActions}>
          <button type="button" className={styles.cancelBtn} onClick={() => navigate('/')}>
            Cancel
          </button>
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <Loader2 className={styles.animateSpin} size={18} /> : <Send size={18} />}
            {loading ? 'Posting...' : 'Post Topic'}
          </button>
        </div>
      </form>
    </div>
  );
}
