import React, { useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useTemplate } from '../context/TemplateContext';
import { getRestaurantId, getRestaurantName } from '../services/restaurantConfig';
import { login, saveAuth } from '../services/authApi';
import './LoginPage.css';

interface Props {
  onLogin: () => void;
  onRegister: () => void;
}

const DARK_TEMPLATES = new Set(['luxe', 'street', 'neon', 'ember', 'cosmic', 'royal']);

const LoginPage: React.FC<Props> = ({ onLogin, onRegister }) => {
  const { template } = useTemplate();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const isDark  = DARK_TEMPLATES.has(template.id);
  const appName = getRestaurantName() ?? 'Zing';
  const primary = template.colors.primary;

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password');
      return;
    }
    const restaurantId = getRestaurantId();
    if (!restaurantId) { setError('Restaurant not configured'); return; }

    setLoading(true);
    setError(null);
    try {
      const { token, user } = await login(email.trim(), password.trim(), restaurantId);
      saveAuth(token, user);
      onLogin();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen scrollY={false}>
        <div className={`login login--${template.id} ${isDark ? 'login--dark' : 'login--light'}`}>

          <div className="login__header">
            <div className="login__brand" style={{ color: primary }}>{appName}</div>
            <h1 className="login__title">Welcome Back</h1>
            <p className="login__subtitle">Sign in to your account</p>
          </div>

          <div className="login__card">
            {error && <div className="login__error">{error}</div>}

            <div className="login__field">
              <label className="login__label">Email</label>
              <input
                className="login__input"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="login__field">
              <label className="login__label">Password</label>
              <div className="login__input-wrap">
                <input
                  className="login__input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <span className="login__eye" onClick={() => setShowPass(p => !p)}>
                  {showPass ? '🙈' : '👁️'}
                </span>
              </div>
            </div>

            <button
              className="login__btn"
              style={{ background: primary, borderColor: primary }}
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>

            <p className="login__switch">
              Don't have an account?{' '}
              <span className="login__switch-link" style={{ color: primary }} onClick={onRegister}>
                Sign Up
              </span>
            </p>
          </div>

        </div>

        {/* Loading overlay */}
        {loading && (
          <div className="login__overlay">
            <div className="login__spinner" />
            <p className="login__overlay-text">Signing in…</p>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default LoginPage;
