import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import styles from "./ResetPasswordConfirm.module.css";
import lock from "../../assets/lock.svg";

const ResetPasswordConfirm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tokenValid, setTokenValid] = useState(false);
  const [email, setEmail] = useState("");

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError("Invalid reset link");
      setValidating(false);
      return;
    }

    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/password-reset/validate/${token}`);
      const data = await response.json();

      if (response.ok && data.valid) {
        setTokenValid(true);
        setEmail(data.email);
      } else {
        setError(data.message || "Invalid or expired reset link");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:3000/api/password-reset/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setError(data.message || "Failed to reset password");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className={styles.resetWrapper}>
        <div className={styles.reset}>
          <div className={styles.resetForm}>
            <img className={styles.resetLockIcon} src={lock} alt="lock" />
            <h2 className={styles.resetTitle}>Validating reset link...</h2>
            <div className={styles.spinner}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className={styles.resetWrapper}>
        <div className={styles.reset}>
          <div className={styles.resetForm}>
            <img className={styles.resetLockIcon} src={lock} alt="lock" />
            <h2 className={styles.resetTitle}>Invalid Reset Link</h2>
            <p className={styles.resetDescription}>{error}</p>
            <Link to="/reset" className={styles.resetButton}>
              Request New Reset Link
            </Link>
          </div>
          <div className={styles.resetBottomBar}>
            <Link to="/login">Back to login</Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className={styles.resetWrapper}>
        <div className={styles.reset}>
          <div className={styles.resetForm}>
            <img className={styles.resetLockIcon} src={lock} alt="lock" />
            <h2 className={styles.resetTitle}>Password Reset Successful!</h2>
            <div className={styles.success}>{success}</div>
            <p className={styles.resetDescription}>
              Redirecting to login page in 3 seconds...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.resetWrapper}>
      <div className={styles.reset}>
        <form className={styles.resetForm} onSubmit={handleSubmit}>
          <img className={styles.resetLockIcon} src={lock} alt="lock" />
          <h2 className={styles.resetTitle}>Set New Password</h2>
          <p className={styles.resetDescription}>
            Enter a new password for {email}
          </p>

          <input
            className={styles.resetInput}
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            disabled={loading}
            minLength={6}
          />

          <input
            className={styles.resetInput}
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
            minLength={6}
          />

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={styles.resetButton} disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>

        <div className={styles.resetBottomBar}>
          <Link to="/login">Back to login</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordConfirm; 