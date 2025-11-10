import { useState } from 'react';
import { authAPI } from '../services/api';

function Login({ onLogin }) {
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' or 'otp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(email, password);
      onLogin(response.data.token, response.data.email);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authAPI.requestOTP(email);
      setOtpSent(true);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.verifyOTP(email, otp);
      onLogin(response.data.token, response.data.email);
    } catch (err) {
      setError(err.response?.data?.error || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>NICL Letter Generator</h1>
          <p>National Insurance Company - Life & Pensions</p>
        </div>

        <div className="login-tabs">
          <button
            className={loginMethod === 'password' ? 'active' : ''}
            onClick={() => {
              setLoginMethod('password');
              setOtpSent(false);
              setError('');
            }}
          >
            Password Login
          </button>
          <button
            className={loginMethod === 'otp' ? 'active' : ''}
            onClick={() => {
              setLoginMethod('otp');
              setError('');
            }}
          >
            OTP Login
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loginMethod === 'password' ? (
          <form onSubmit={handlePasswordLogin} className="login-form">
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        ) : (
          <form onSubmit={otpSent ? handleVerifyOTP : handleRequestOTP} className="login-form">
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={otpSent}
              />
            </div>
            {otpSent && (
              <div className="form-group">
                <label>Enter OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  maxLength="6"
                  required
                />
                <small>OTP has been sent to your email</small>
              </div>
            )}
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Processing...' : otpSent ? 'Verify OTP' : 'Send OTP'}
            </button>
            {otpSent && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setOtpSent(false);
                  setOtp('');
                }}
              >
                Change Email
              </button>
            )}
          </form>
        )}

        <div className="login-footer">
          <p>Authorized users only</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
