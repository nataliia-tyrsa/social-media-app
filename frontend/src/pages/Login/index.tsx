import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "@/services/auth";
import styles from "./Login.module.css";

import logo from "@/assets/logo.svg";
import phone from "@/assets/phone.svg";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await loginUser({ email, password });

    if (result.success) {
      navigate("/feed");
    } else {
      setError(result.message || "Ошибка входа");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.left}>
        <img src={phone} alt="phone preview" />
      </div>

      <div className={styles.right}>
        <div className={styles.loginBox}>
          <img src={logo} alt="logo" className={styles.logo} />

          <form onSubmit={handleSubmit} className={styles.form}>
            <input
              type="email"
              placeholder="Username, or email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit">Log in</button>
          </form>

          <div className={styles.separator}>OR</div>

          <button type="button" className={styles.forgot}>Forgot password?</button>
        </div>

        <div className={styles.signupBox}>
          <p>
            Don't have an account?{" "}
            <button type="button" className={styles.signup}>Sign up</button>
          </p>
        </div>
      </div>
    </div>
  );
}