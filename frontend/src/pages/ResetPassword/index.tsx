import { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./ResetPassword.module.css";
import lock from "../../assets/lock.svg";

const ResetPassword = () => {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("http://localhost:3000/api/password-reset/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier: input }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
      } else {
        setError(data.message || "Failed to send reset link");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
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
            disabled={loading}
          />

          {error && <div className={styles.error}>{error}</div>}
          {message && <div className={styles.success}>{message}</div>}

          <button type="submit" className={styles.resetButton} disabled={loading}>
            {loading ? "Sending..." : "Reset your password"}
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