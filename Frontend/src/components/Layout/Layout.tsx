import { FormEvent, useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Home, Search, PlusSquare, User, Bell, Sun, Moon, Edit2, Trash2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { api } from '../../services/api';
import Swal from 'sweetalert2';
import styles from './Layout.module.css';

export default function Layout() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
  const [trendingTags, setTrendingTags] = useState<{id: number, name: string, topicCount: number}[]>([]);
  const activeCategory = searchParams.get('category');
  const activeTags = searchParams.getAll('tags');

  const fetchInitialData = async () => {
    try {
      const [catData, tagData] = await Promise.all([
        api.categories.getAll(),
        api.tags.getAll()
      ]);
      setCategories(catData);
      setTrendingTags(tagData);
    } catch (err) {
      console.error('Failed to fetch sidebar data:', err);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [searchParams.get('category'), searchParams.get('tags')]); 

  const toggleTag = (tagName: string) => {
    const newParams = new URLSearchParams(searchParams);
    const existingTags = newParams.getAll('tags');
    
    if (existingTags.includes(tagName)) {
      // Remove tag
      const filtered = existingTags.filter(t => t !== tagName);
      newParams.delete('tags');
      filtered.forEach(t => newParams.append('tags', t));
    } else {
      // Add tag
      newParams.append('tags', tagName);
    }
    
    navigate(`/?${newParams.toString()}`);
  };
  const handleEditCategory = async (e: React.MouseEvent, id: number, currentName: string) => {
    e.stopPropagation();
    const { value: newName } = await Swal.fire({
      title: 'Edit Category',
      input: 'text',
      inputValue: currentName,
      showCancelButton: true,
      ...swalConfig
    });

    if (newName && newName !== currentName) {
      try {
        await api.categories.update(id, newName);
        fetchInitialData();
        Swal.fire({ title: 'Updated!', icon: 'success', timer: 1500, showConfirmButton: false, ...swalConfig });
      } catch (err: any) {
        Swal.fire({ title: 'Error', text: err.message, icon: 'error', ...swalConfig });
      }
    }
  };

  const handleDeleteCategory = async (e: React.MouseEvent, id: number, name: string) => {
    e.stopPropagation();
    const result = await Swal.fire({
      title: `Delete "${name}"?`,
      text: "This will only work if no topics are using this category.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      ...swalConfig
    });

    if (result.isConfirmed) {
      try {
        await api.categories.delete(id);
        fetchInitialData();
        Swal.fire({ title: 'Deleted!', icon: 'success', timer: 1500, showConfirmButton: false, ...swalConfig });
      } catch (err: any) {
        Swal.fire({ title: 'Error', text: "Cannot delete category. Ensure it has no topics associated with it.", icon: 'error', ...swalConfig });
      }
    }
  };

  const handleEditTag = async (e: React.MouseEvent, id: number, currentName: string) => {
    e.stopPropagation();
    const { value: newName } = await Swal.fire({
      title: 'Edit Tag',
      input: 'text',
      inputValue: currentName,
      showCancelButton: true,
      ...swalConfig
    });

    if (newName && newName !== currentName) {
      try {
        await api.tags.update(id, newName);
        fetchInitialData();
        Swal.fire({ title: 'Updated!', icon: 'success', timer: 1500, showConfirmButton: false, ...swalConfig });
      } catch (err: any) {
        Swal.fire({ title: 'Error', text: err.response?.data || err.message, icon: 'error', ...swalConfig });
      }
    }
  };

  const handleDeleteTag = async (e: React.MouseEvent, id: number, name: string) => {
    e.stopPropagation();
    const result = await Swal.fire({
      title: `Delete "#${name}"?`,
      text: "This will only work if no topics are using this tag.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      ...swalConfig
    });

    if (result.isConfirmed) {
      try {
        await api.tags.delete(id);
        fetchInitialData();
        Swal.fire({ title: 'Deleted!', icon: 'success', timer: 1500, showConfirmButton: false, ...swalConfig });
      } catch (err: any) {
        Swal.fire({ title: 'Error', text: err.response?.data || "Cannot delete tag. Ensure it has no topics associated with it.", icon: 'error', ...swalConfig });
      }
    }
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // Navigate to root and clear category/tags filters
      navigate(`/?q=${encodeURIComponent(query.trim())}`);
    } else {
      navigate(`/`);
    }
  };

  // Sync internal search input with URL if it changes externally
  useEffect(() => {
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  const swalConfig = {
    background: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    confirmButtonColor: 'var(--accent-primary)'
  };


  return (
    <div className={styles.container}>
      <header className={`glass-panel ${styles.header}`}>
        <div className={styles.headerContent}>
          <Link to="/" className={styles.logo}>
            <div className={styles.logoIcon}>in</div>
            <span>connect</span>
          </Link>
          
          <form className={styles.searchBar} onSubmit={handleSearch}>
            <Search size={18} className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search topics... (Press Enter)" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </form>

          <nav className={styles.navIcons}>
            <Link to="/" className={styles.navButton} aria-label="Home">
              <Home size={22} className={!searchParams.get('q') && !activeCategory ? styles.activeIcon : ''} />
            </Link>
            <button className={styles.navButton} aria-label="Toggle Theme" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className={styles.navButton} aria-label="Notifications" onClick={() => Swal.fire({ title: 'Notifications Coming Soon!', icon: 'info', ...swalConfig })}>
              <Bell size={22} />
            </button>
            <Link to="/create" style={{textDecoration: 'none'}}>
              <button className={`${styles.navButton} ${styles.createButton}`}>
                <PlusSquare size={20} />
                <span>New Topic</span>
              </button>
            </Link>
            {user ? (
              <Link to="/profile" className={styles.avatarLink}>
                <div className={styles.avatar}>
                  {user.profileimage ? (
                    <img src={`${import.meta.env.VITE_API_URL.replace('/api', '')}/profile-images/${user.profileimage}`} alt="Profile" className={styles.avatarImg} />
                  ) : (
                    <span className={styles.avatarInitial}>{user.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
              </Link>
            ) : (
              <Link to="/auth" style={{textDecoration: 'none'}}>
                <button className={`${styles.navButton} ${styles.loginButton}`}>
                  <User size={18} />
                  <span>Sign In</span>
                </button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.contentWrapper}>
          <aside className={styles.sidebar}>
            <nav className={styles.sideNav}>
              <h3 className={styles.sideNavTitle}>Discover</h3>
              <ul className={styles.categoryList}>
                <li className={!activeCategory ? styles.activeCategory : ''} onClick={() => navigate('/')}>All Topics</li>
                {categories.map(cat => (
                  <li 
                    key={cat.id} 
                    className={`${styles.categoryItem} ${activeCategory === cat.name ? styles.activeCategory : ''}`}
                    onClick={() => navigate(`/?category=${encodeURIComponent(cat.name)}`)}
                  >
                    <span>{cat.name}</span>
                    <div className={styles.categoryActions}>
                      <button onClick={(e) => handleEditCategory(e, cat.id, cat.name)} title="Rename Category">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={(e) => handleDeleteCategory(e, cat.id, cat.name)} title="Delete Category" className={styles.deleteCategoryBtn}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <section className={styles.feedColumn}>
            <Outlet />
          </section>

          <aside className={styles.rightSidebar}>
            <div className={`glass-panel ${styles.trendingPanel}`}>
              <div className={styles.trendingHeader}>
                <h3 className={styles.trendingTitle}>Trending Tags</h3>
                {activeTags.length > 0 && (
                  <button className={styles.clearTagsBtn} onClick={() => {
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete('tags');
                    navigate(`/?${newParams.toString()}`);
                  }}>Clear Filters</button>
                )}
              </div>
              <div className={styles.tagChips}>
                {trendingTags.length > 0 ? trendingTags.map(tag => (
                  <span 
                    key={tag.id} 
                    className={`${styles.tag} ${activeTags.includes(tag.name) ? styles.activeTag : ''}`}
                    onClick={() => toggleTag(tag.name)}
                    title={`${tag.topicCount} topics`}
                  >
                    <div className={styles.tagLabel}>
                      #{tag.name}
                      <span className={styles.tagCount}>{tag.topicCount}</span>
                    </div>
                    <div className={styles.tagActions}>
                      <button onClick={(e) => handleEditTag(e, tag.id, tag.name)} title="Rename Tag">
                        <Edit2 size={11} />
                      </button>
                      <button onClick={(e) => handleDeleteTag(e, tag.id, tag.name)} title="Delete Tag" className={styles.deleteTagBtn}>
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </span>
                )) : (
                  <p className={styles.noTags}>No tags yet</p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
