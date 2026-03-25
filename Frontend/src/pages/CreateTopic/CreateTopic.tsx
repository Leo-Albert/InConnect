import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';
import CreatableSelect from 'react-select/creatable';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { api } from '../../services/api';
import styles from './CreateTopic.module.css';

interface CategoryOption {
  value: string;
  label: string;
}

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
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<CategoryOption[]>([]);
  const [selectedTags, setSelectedTags] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);

  const EditorClass: any = ClassicEditor;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catData, tagData] = await Promise.all([
          api.categories.getAll(),
          api.tags.getAll()
        ]);
        
        const catOptions = catData.map((c: any) => ({ value: c.id.toString(), label: c.name }));
        setCategories(catOptions);
        if (catOptions.length > 0) setCategoryId(catOptions[0].value);

        const tagOptions = tagData.map((t: any) => ({ value: t.name, label: t.name }));
        setAvailableTags(tagOptions);
      } catch (err) {
        console.error('Failed to fetch initial data:', err);
      } finally {
        setFetchingData(false);
      }
    };
    fetchData();
  }, []);

  const handleCreateCategory = async (inputValue: string) => {
    setLoading(true);
    try {
      const newCategory = await api.categories.create(inputValue);
      const newOption = { value: newCategory.id.toString(), label: newCategory.name };
      setCategories(prev => [...prev, newOption]);
      setCategoryId(newOption.value);
      Swal.fire({
        title: 'New Category Added!',
        text: `Category "${inputValue}" created and selected.`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        background: 'var(--bg-surface)',
        color: 'var(--text-primary)'
      });
    } catch (err: any) {
      Swal.fire({
        title: 'Error!',
        text: err.message || 'Failed to create category.',
        icon: 'error',
        background: 'var(--bg-surface)',
        color: 'var(--text-primary)'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title || !content || !categoryId) return;
    
    setLoading(true);
    try {
      const tagNames = selectedTags.map(t => t.value);
      await api.topics.create({ 
        title, 
        content, 
        categoryId: parseInt(categoryId),
        tags: tagNames 
      });
      window.dispatchEvent(new Event('topicUpdated'));
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
          <CreatableSelect 
            isClearable
            isDisabled={loading || fetchingData}
            isLoading={fetchingData}
            onCreateOption={handleCreateCategory}
            options={categories}
            styles={selectStyles}
            value={categories.find(o => o.value === categoryId)}
            onChange={(option: any) => setCategoryId(option?.value || null)}
            placeholder={fetchingData ? "Loading..." : "Select or create category..."}
          />
        </div>

        <div className={styles.formGroup}>
          <label>Tags (Select or type to create)</label>
          <CreatableSelect
            isMulti
            isClearable
            isDisabled={loading || fetchingData}
            options={availableTags}
            styles={selectStyles}
            value={selectedTags}
            onChange={(options) => setSelectedTags(options as CategoryOption[])}
            placeholder="Search tags or create new ones..."
          />
        </div>

        <div className={styles.formGroup}>
          <label>Discussion Content</label>
          <div className={styles.editorWrapper}>
            <CKEditor
              editor={EditorClass}
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
