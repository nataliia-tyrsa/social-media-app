import { useState } from "react";
import { Link } from "react-router-dom";
import "./ResetPassword.css";
import lock from "../../assets/lock.svg";

const ResetPassword = () => {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Reset link sent to: ${input}`);
  };

  return (
    <div className="reset-wrapper">
      <form className="reset-form" onSubmit={handleSubmit}>
        <img className="reset-lock-icon" src={lock} alt="lock" />
        <h2 className="reset-title">Trouble logging in?</h2>
        <p className="reset-description">
          Enter your email, phone, or username and we'll send you a link to get
          back into your account.
        </p>

        <input
          className="reset-input"
          type="text"
          placeholder="Email or Username"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          required
        />

        <button type="submit" className="reset-button">
          Reset your password
        </button>

        <div className="reset-divider">
          <hr />
          <span>OR</span>
          <hr />
        </div>

        <Link to="/signup" className="reset-create-link">
          Create new account
        </Link>

        <div className="reset-bottom-bar">
        <Link to="/">Back to login</Link>
      </div>
      </form>

      
    </div>
  );
};

export default ResetPassword;