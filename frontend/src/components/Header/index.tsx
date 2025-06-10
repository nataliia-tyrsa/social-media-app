import UserMenu from '../UserMenu';
import styles from './Header.module.css';

const Header = () => {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <h1 className={styles.title}>ICHGGRAM</h1>
        <UserMenu />
      </div>
    </header>
  );
};

export default Header; 