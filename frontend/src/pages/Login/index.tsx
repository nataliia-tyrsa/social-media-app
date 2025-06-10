import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../../services/auth";
import styles from "./Login.module.css";

import logo from "@/assets/logo.svg";
import phone from "@/assets/phone.svg";

export default function Login() {
  const [identifier, setIdentifier] = useState(""); 
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await loginUser({ identifier, password });

    if (result.success) {
      navigate("/feed");
    } else {
      setError(result.message || "Login error");
    }

    setLoading(false);
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.phonePreview}>
        <img src={phone} alt="phone preview" />
      </div>

      <div className={styles.loginContent}>
        <div className={styles.loginBox}>
          <img src={logo} alt="logo" className={styles.logo} />

          <form onSubmit={handleSubmit} className={styles.loginForm}>
            <input
              type="text"
              placeholder="Username or Email"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                setError("");
              }}
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              required
            />

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <div className={styles.divider}>
            <hr />
            <span>OR</span>
            <hr />
          </div>

          <Link to="/reset" className={styles.forgotPassword}>
            Forgot password?
          </Link>
        </div>

        <div className={styles.signupPrompt}>
          <p>
            Don't have an account?{" "}
            <Link to="/register" className={styles.signupLink}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}