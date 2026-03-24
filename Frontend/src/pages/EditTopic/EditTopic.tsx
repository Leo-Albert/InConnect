import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, Loader2, ArrowLeft } from 'lucide-react';
import Swal from 'sweetalert2';
import Select from 'react-select';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { api } from '../../services/api';

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

export default function EditTopic() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('1'); 
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const EditorClass: any = ClassicEditor;

  useEffect(() => {
    const fetchTopic = async () => {
      if (!id) return;
      try {
        const found = await api.topics.getById(id);
        
        if (found) {
          setTitle(found.title);
          setContent(found.content);
          // Find category value by name or matching ID logic
          const cat = categoryOptions.find(o => o.label === found.categoryName);
          if (cat) setCategoryId(cat.value);
        } else {
           throw new Error("Topic not found");
        }
      } catch (err: any) {
        Swal.fire({
          title: 'Error',
          text: 'Failed to load topic details.',
          icon: 'error',
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)'
        });
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchTopic();
  }, [id, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || !title || !content) return;
    
    setSaving(true);
    try {
      await api.topics.update(id, { title, content, categoryId: parseInt(categoryId) });
      Swal.fire({
        title: 'Success!',
        text: 'Your post has been updated.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        background: 'var(--bg-surface)',
        color: 'var(--text-primary)'
      });
      navigate('/');
    } catch (err: any) {
      Swal.fire({
        title: 'Failed to Update',
        text: err.message || 'An error occurred while saving your changes.',
        icon: 'error',
        background: 'var(--bg-surface)',
        color: 'var(--text-primary)'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
        <Loader2 className="animate-spin" size={48} color="var(--accent-primary)" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <button 
        onClick={() => navigate('/')} 
        style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '24px', cursor: 'pointer' }}
      >
        <ArrowLeft size={18} /> Back to Feed
      </button>

      <h1 style={{ fontSize: '1.75rem', marginBottom: '24px', color: 'var(--text-primary)' }}>Edit Discussion</h1>
      
      <form className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }} onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontWeight: '500', color: 'var(--text-secondary)' }}>Title</label>
          <input 
            type="text" 
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            style={{ 
              background: 'var(--bg-surface)', 
              border: '1px solid var(--border-light)', 
              padding: '12px', 
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '1rem'
            }}
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontWeight: '500', color: 'var(--text-secondary)' }}>Category</label>
          <Select 
            options={categoryOptions}
            styles={selectStyles}
            value={categoryOptions.find(o => o.value === categoryId)}
            onChange={(option: any) => setCategoryId(option?.value || '1')}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontWeight: '500', color: 'var(--text-secondary)' }}>Content</label>
          <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
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

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '12px' }}>
          <button 
            type="button" 
            onClick={() => navigate('/')}
            style={{ padding: '10px 24px', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={saving}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              background: 'var(--accent-gradient)', 
              color: 'white', 
              padding: '10px 32px', 
              borderRadius: 'var(--radius-md)', 
              fontWeight: '600',
              cursor: 'pointer',
              opacity: saving ? 0.7 : 1
            }}
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
