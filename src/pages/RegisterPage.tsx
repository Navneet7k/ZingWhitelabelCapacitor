import React, { useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useTemplate } from '../context/TemplateContext';
import { getRestaurantName } from '../services/restaurantConfig';
import './RegisterPage.css';

interface Props {
  onRegister: () => void;
  onBack: () => void;
}

const DARK_TEMPLATES = new Set(['luxe', 'street', 'neon', 'ember', 'cosmic', 'royal']);

const RegisterPage: React.FC<Props> = ({ onRegister, onBack }) => {
  const { template } = useTemplate();
  const [name,     setName]     = useState('');
  const [phone,    setPhone]    = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');

  const isDark  = DARK_TEMPLATES.has(template.id);
  const appName = getRestaurantName() ?? 'Zing';
  const primary = template.colors.primary;

  return (
    <IonPage>
      <IonContent fullscreen scrollY>
        <div className={`register register--${template.id} ${isDark ? 'register--dark' : 'register--light'}`}>

          {/* Header */}
          <div className="register__header">
            <div className="register__brand" style={{ color: primary }}>{appName}</div>
            <h1 className="register__title">Create Account</h1>
            <p className="register__subtitle">Join us and start ordering</p>
          </div>

          {/* Form card */}
          <div className="register__card">
            <div className="register__field">
              <label className="register__label">Full Name</label>
              <input
                className="register__input"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="register__field">
              <label className="register__label">Phone</label>
              <input
                className="register__input"
                type="tel"
                placeholder="+1 000 000 0000"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>

            <div className="register__field">
              <label className="register__label">Email</label>
              <input
                className="register__input"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="register__field">
              <label className="register__label">Password</label>
              <input
                className="register__input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <button
              className="register__btn"
              style={{ background: primary, borderColor: primary }}
              onClick={onRegister}
            >
              Create Account
            </button>

            <p className="register__switch">
              Already have an account?{' '}
              <span className="register__switch-link" style={{ color: primary }} onClick={onBack}>
                Sign In
              </span>
            </p>
          </div>

          <div style={{ height: 32 }} />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default RegisterPage;
