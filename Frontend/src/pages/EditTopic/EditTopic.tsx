import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, Loader2, ArrowLeft } from 'lucide-react';
import Swal from 'sweetalert2';
import CreatableSelect from 'react-select/creatable';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { api } from '../../services/api';

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

export default function EditTopic() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<CategoryOption[]>([]);
  const [selectedTags, setSelectedTags] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);

  const EditorClass: any = ClassicEditor;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catData, tagData] = await Promise.all([
          api.categories.getAll(),
          api.tags.getAll()
        ]);
        setCategories(catData.map((c: any) => ({ value: c.id.toString(), label: c.name })));
        setAvailableTags(tagData.map((t: any) => ({ value: t.name, label: t.name })));
      } catch (err) {
        console.error('Failed to fetch categories/tags:', err);
      } finally {
        setFetchingData(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchTopic = async () => {
      if (!id) return;
      try {
        const found = await api.topics.getById(id);
        
        if (found) {
          setTitle(found.title);
          setContent(found.content);
          if (found.categoryId) setCategoryId(found.categoryId.toString());
          if (found.tags) {
            setSelectedTags(found.tags.map((t: string) => ({ value: t, label: t })));
          }
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

  const handleCreateCategory = async (inputValue: string) => {
    setSaving(true);
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
      setSaving(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || !title || !content || !categoryId) return;
    
    setSaving(true);
    try {
      const tagNames = selectedTags.map(t => t.value);
      await api.topics.update(id, { 
        title, 
        content, 
        categoryId: parseInt(categoryId),
        tags: tagNames
      });
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
          <CreatableSelect 
            isClearable
            isDisabled={saving || fetchingData}
            isLoading={fetchingData}
            onCreateOption={handleCreateCategory}
            options={categories}
            styles={selectStyles}
            value={categories.find(o => o.value === categoryId)}
            onChange={(option: any) => setCategoryId(option?.value || null)}
            placeholder={fetchingData ? "Loading..." : "Select or create category..."}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontWeight: '500', color: 'var(--text-secondary)' }}>Tags</label>
          <CreatableSelect
            isMulti
            isClearable
            isDisabled={saving || fetchingData}
            options={availableTags}
            styles={selectStyles}
            value={selectedTags}
            onChange={(options) => setSelectedTags(options as CategoryOption[])}
            placeholder="Search tags or create new ones..."
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
