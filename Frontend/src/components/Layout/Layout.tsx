import { FormEvent, useState } from 'react';
import { Outlet, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Home, Search, PlusSquare, User, Bell } from 'lucide-react';
import Swal from 'sweetalert2';
import styles from './Layout.module.css';

export default function Layout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const activeCategory = searchParams.get('category');
  const activeTag = searchParams.get('tag');

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/?q=${encodeURIComponent(query.trim())}`);
    } else {
      navigate(`/`);
    }
  };

  const swalConfig = {
    background: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    confirmButtonColor: 'var(--accent-primary)'
  };

  const categories = ['Backend', 'Frontend', 'Database', 'System Design', 'DevOps', 'HR Behavioral'];
  const tags = ['React', 'CSharp', 'SystemDesign', 'PostgreSQL', 'Microservices'];

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
            <button className={styles.navButton} aria-label="Notifications" onClick={() => Swal.fire({ title: 'Notifications Coming Soon!', icon: 'info', ...swalConfig })}>
              <Bell size={22} />
            </button>
            <Link to="/create" style={{textDecoration: 'none'}}>
              <button className={`${styles.navButton} ${styles.createButton}`}>
                <PlusSquare size={20} />
                <span>New Topic</span>
              </button>
            </Link>
            <div className={styles.avatar} onClick={() => Swal.fire({ title: 'Profile Management Coming Soon!', icon: 'info', ...swalConfig })}>
              <User size={20} />
            </div>
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
                    key={cat} 
                    className={activeCategory === cat ? styles.activeCategory : ''}
                    onClick={() => navigate(`/?category=${encodeURIComponent(cat)}`)}
                  >
                    {cat}
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
              <h3 className={styles.trendingTitle}>Trending Tags</h3>
              <div className={styles.tagChips}>
                {tags.map(tag => (
                  <span 
                    key={tag} 
                    className={`${styles.tag} ${activeTag === tag ? styles.activeTag : ''}`}
                    onClick={() => Swal.fire({ title: `Tag Route Triggered!`, text: `Filtering feed for #${tag} hitting backend.`, icon: 'success', ...swalConfig})}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
