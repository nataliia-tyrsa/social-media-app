import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Register.css';
import logo from '../../assets/logo.svg';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      navigate('/');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unexpected error');
      }
    }
  };

  return (
    <div className="register-wrapper">
      <div className="register-box">
        <form className="register-form" onSubmit={handleSubmit}>
          <img className="register-logo" src={logo} alt="ICHCGRAM" />
          <p className="register-subtitle">
            Sign up to see photos and videos from your friends.
          </p>

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            name="fullName"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={handleChange}
            required
          />
          <input
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          {error && <p className="register-error">{error}</p>}

          <p className="register-info">
            People who use our service may have uploaded your contact
            information to Instagram. <span>Learn More</span>
          </p>

          <p className="register-info">
            By signing up, you agree to our <span>Terms</span>,{' '}
            <span>Privacy Policy</span> and <span>Cookies Policy</span>.
          </p>

          <button type="submit" className="register-btn">Sign up</button>
        </form>

        <div className="register-footer">
          <p>
            Have an account? <Link to="/">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;