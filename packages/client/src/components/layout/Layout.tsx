import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../common/Logo';
import styles from './Layout.module.css';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <Link to="/" className={styles.logoLink}>
          <Logo size={32} />
          <span className={styles.logoText}>MeetShare<span className={styles.logoApp}>.app</span></span>
        </Link>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
