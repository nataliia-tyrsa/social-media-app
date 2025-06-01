import { useState } from 'react';
import { Link } from 'react-router-dom';
import './ResetPassword.css'; // если будут стили

const ResetPassword = () => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // тут можно отправить запрос на /api/auth/reset (если есть)
    alert(`Reset link sent to: ${input}`);
  };

  return (
    <div className="reset-container">
      <form className="reset-form" onSubmit={handleSubmit}>
        <h1 className="logo">ICHCGRAM</h1>
        <h2>Trouble logging in?</h2>
        <p>Enter your email or username and we’ll send you a link to get back into your account.</p>

        <input
          type="text"
          placeholder="Email or Username"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          required
        />

        <button type="submit">Reset your password</button>

        <div className="footer">
          <p>
            or <Link to="/signup">Create new account</Link>
          </p>
          <p>
            <Link to="/">Back to login</Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default ResetPassword;