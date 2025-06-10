import { useState } from 'react';
import SearchPanel from '../../components/SearchPanel';
import styles from './Search.module.css';

export default function Search() {
  return (
    <div className={styles.container}>
      <SearchPanel isOpen={true} onClose={() => {}} />
    </div>
  );
} 