import { NavLink } from "react-router-dom";
import styles from "./Sidebar.module.css";
import logo from "@/assets/logo.svg";
// import profileImg from "@/assets/profile.png"; 

import {
  Home,
  Search,
  Compass,
  MessageCircle,
  Heart,
  PlusSquare,
//   User,
}  from "lucide-react"; 

const Sidebar = () => {
  return (
    <aside className={styles.sidebar}>
      <img src={logo} alt="ICHGGRAM" className={styles.logo} />

      <nav className={styles.nav}>
        <NavLink to="/feed" className={styles.link}>
          <Home size={22} />
          <span>Home</span>
        </NavLink>
        <NavLink to="/search" className={styles.link}>
          <Search size={22} />
          <span>Search</span>
        </NavLink>
        <NavLink to="/explore" className={styles.link}>
          <Compass size={22} />
          <span>Explore</span>
        </NavLink>
        <NavLink to="/messages" className={styles.link}>
          <MessageCircle size={22} />
          <span>Messages</span>
        </NavLink>
        <NavLink to="/notifications" className={styles.link}>
          <Heart size={22} />
          <span>Notifications</span>
        </NavLink>
        <NavLink to="/create" className={styles.link}>
          <PlusSquare size={22} />
          <span>Create</span>
        </NavLink>
        <NavLink to="/profile" className={styles.link}>
          {/* <img src={profileImg} alt="Profile" className={styles.avatar} /> */}
          <span>Profile</span>
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;