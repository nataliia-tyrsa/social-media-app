import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../../services/auth';
import styles from "./Register.module.css";
import logo from '../../assets/logo.svg';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: value || '' 
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await registerUser(formData);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message || 'Registration failed');
    }

    setLoading(false);
  };

  return (
    <div className={styles.registerWrapper}>
      <div className={styles.registerBox}>
        <form className={styles.registerForm} onSubmit={handleSubmit} noValidate>
          <img className={styles.registerLogo} src={logo} alt="ICHCGRAM" />
          <p className={styles.registerSubtitle}>
            Sign up to see photos and videos from your friends.
          </p>

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email || ''}
            onChange={handleChange}
            required
            className={styles.registerInput}
          />
          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={formData.fullName || ''}
            onChange={handleChange}
            required
            className={styles.registerInput}
          />
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username || ''}
            onChange={handleChange}
            required
            className={styles.registerInput}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password || ''}
            onChange={handleChange}
            required
            className={styles.registerInput}
          />

          {error && <p className={styles.registerError}>{error}</p>}

          <p className={styles.registerInfo}>
            People who use our service may have uploaded your contact
            information to Instagram. <span>Learn More</span>
          </p>

          <p className={styles.registerInfo}>
            By signing up, you agree to our <span>Terms</span>,{' '}
            <span>Privacy Policy</span> and <span>Cookies Policy</span>.
          </p>

          <button type="submit" className={styles.registerBtn} disabled={loading}>
            {loading ? 'Signing up...' : 'Sign up'}
          </button>
        </form>

        <div className={styles.registerFooter}>
          <p>
            Have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;