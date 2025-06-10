import { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./ResetPassword.module.css";
import lock from "../../assets/lock.svg";

const ResetPassword = () => {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Reset link sent to: ${input}`);
  };

  return (
    <div className={styles.resetWrapper}>
      <div className={styles.reset}>
        <form className={styles.resetForm} onSubmit={handleSubmit}>
          <img className={styles.resetLockIcon} src={lock} alt="lock" />
          <h2 className={styles.resetTitle}>Trouble logging in?</h2>
          <p className={styles.resetDescription}>
            Enter your email, phone, or username and we'll send you a link to get
            back into your account.
          </p>

          <input
            className={styles.resetInput}
            type="text"
            placeholder="Email or Username"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            required
          />

          <button type="submit" className={styles.resetButton}>
            Reset your password
          </button>

          <div className={styles.resetDivider}>
            <hr />
            <span>OR</span>
            <hr />
          </div>

          <Link to="/register" className={styles.resetCreateLink}>
            Create new account
          </Link>
        </form>

        <div className={styles.resetBottomBar}>
          <Link to="/login">Back to login</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;