import React, { useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useTemplate } from '../context/TemplateContext';
import { getRestaurantName } from '../services/restaurantConfig';
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

  const isDark      = DARK_TEMPLATES.has(template.id);
  const appName     = getRestaurantName() ?? 'Zing';
  const primary     = template.colors.primary;

  return (
    <IonPage>
      <IonContent fullscreen scrollY={false}>
        <div className={`login login--${template.id} ${isDark ? 'login--dark' : 'login--light'}`}>

          {/* Header / brand */}
          <div className="login__header">
            <div className="login__brand" style={{ color: primary }}>{appName}</div>
            <h1 className="login__title">Welcome Back</h1>
            <p className="login__subtitle">Sign in to your account</p>
          </div>

          {/* Form card */}
          <div className="login__card">
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
              <input
                className="login__input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <div className="login__forgot">
              <span style={{ color: primary }}>Forgot password?</span>
            </div>

            <button
              className="login__btn"
              style={{ background: primary, borderColor: primary }}
              onClick={onLogin}
            >
              Sign In
            </button>

            <p className="login__switch">
              Don't have an account?{' '}
              <span className="login__switch-link" style={{ color: primary }} onClick={onRegister}>
                Sign Up
              </span>
            </p>
          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default LoginPage;
