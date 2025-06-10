import styles from "./NotFound.module.css";
import phone from "../../assets/phone.svg";

const NotFound = () => {
  return (
    <div className={styles.container}>
      <div className={styles.imageWrapper}>
        <img src={phone} alt="Instagram phones" />
      </div>
      <div className={styles.text}>
        <h1>Oops! Page Not Found (404 Error)</h1>
        <p>
          We're sorry, but the page you're looking for doesn't seem to exist. If
          you typed the URL manually, please double-check the spelling. If you
          clicked on a link, it may be outdated or broken.
        </p>
      </div>
    </div>
  );
};

export default NotFound;
