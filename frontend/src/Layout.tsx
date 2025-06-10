import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import styles from './Layout.module.css';

const Layout: React.FC = () => {
  return (
    <div className={styles.layout}>
      <div className={styles.sidebar}>
        <Sidebar />
      </div>
      <main className={styles.content}>
        <div className={styles.pageContent}>
          <Outlet />
        </div>
        <div className={styles.footer}>
          <Footer />
        </div>
      </main>
    </div>
  );
};

export default Layout;