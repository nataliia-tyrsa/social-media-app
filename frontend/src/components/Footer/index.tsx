// import { useState } from "react";
import { Link } from "react-router-dom";
import styles from './Footer.module.css';

const Footer = () => {
    return (
        <footer className={styles.footer}>
        <ul className={styles.footerNav}>
          <li><Link to="/" className={styles.footerLink}>Home</Link></li>
          <li><span className={styles.footerLink}>Search</span></li>
          <li><span className={styles.footerLink}>Explore</span></li>
          <li><Link to="/messages" className={styles.footerLink}>Messages</Link></li>
          <li><span className={styles.footerLink}>Notifications</span></li>
          <li><Link to="/create" className={styles.footerLink}>Create</Link></li>
        </ul>
        <p className={styles.footerCopy}>© 2025 ICHgram</p>
      </footer>
    )
}

export default Footer;

