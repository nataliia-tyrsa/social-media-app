// import { useState } from "react";
// import { Link } from "react-router-dom";
import styles from './Footer.module.css';

const Footer = () => {
    return (
        <footer className={styles.footer}>
        <ul className={styles.footerNav}>
          <li>Home</li>
          <li>Search</li>
          <li>Explore</li>
          <li>Messages</li>
          <li>Notifications</li>
          <li>Create</li>
        </ul>
        <p className={styles.footerCopy}>© 2025 ICHgram</p>
      </footer>
    )
}

export default Footer;

