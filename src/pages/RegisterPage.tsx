import React, { useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useTemplate } from '../context/TemplateContext';
import { getRestaurantId, getRestaurantName } from '../services/restaurantConfig';
import { register } from '../services/authApi';
import './RegisterPage.css';

interface Props {
  onRegister: () => void;
  onBack: () => void;
}

const DARK_TEMPLATES = new Set(['luxe', 'street', 'neon', 'ember', 'cosmic', 'royal']);

const EMAIL_RE  = /^[\w.-]+@([\w-]+\.)+[\w-]{2,4}$/;
const MOBILE_RE = /^\+?\d{7,15}$/;

const RegisterPage: React.FC<Props> = ({ onRegister, onBack }) => {
  const { template } = useTemplate();

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [mobile,   setMobile]   = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isDark  = DARK_TEMPLATES.has(template.id);
  const appName = getRestaurantName() ?? 'Zing';
  const primary = template.colors.primary;

  const validate = (): string | null => {
    if (!name.trim())                  return 'Please enter your name';
    if (!EMAIL_RE.test(email.trim()))  return 'Please enter a valid email';
    if (!MOBILE_RE.test(mobile.trim())) return 'Please enter a valid mobile number';
    if (password.length < 6)           return 'Password must be at least 6 characters';
    if (password !== confirm)          return 'Passwords do not match';
    return null;
  };

  const handleRegister = async () => {
    const err = validate();
    if (err) { setError(err); return; }

    const restaurantId = getRestaurantId();
    if (!restaurantId) { setError('Restaurant not configured'); return; }

    setLoading(true);
    setError(null);
    try {
      await register({
        name:                 name.trim(),
        email:                email.trim(),
        mobile:               mobile.trim(),
        password,
        passwordConfirmation: confirm,
        restaurantId,
      });
      setSuccess(true);
      setTimeout(() => onBack(), 1500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen scrollY>
        <div className={`register register--${template.id} ${isDark ? 'register--dark' : 'register--light'}`}>

          <div className="register__header">
            <div className="register__brand" style={{ color: primary }}>{appName}</div>
            <h1 className="register__title">Create Account</h1>
            <p className="register__subtitle">Join us and start ordering</p>
          </div>

          <div className="register__card">
            {error   && <div className="register__error">{error}</div>}
            {success && <div className="register__success">Registration successful! Redirecting to login…</div>}

            <div className="register__field">
              <label className="register__label">Full Name</label>
              <input className="register__input" type="text" placeholder="John Doe"
                value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div className="register__field">
              <label className="register__label">Email</label>
              <input className="register__input" type="email" placeholder="your@email.com"
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>

            <div className="register__field">
              <label className="register__label">Mobile Number</label>
              <input className="register__input" type="tel" placeholder="+1 000 000 0000"
                value={mobile} onChange={e => setMobile(e.target.value)} />
            </div>

            <div className="register__field">
              <label className="register__label">Password</label>
              <div className="register__input-wrap">
                <input className="register__input" type={showPass ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={password} onChange={e => setPassword(e.target.value)} />
                <span className="register__eye" onClick={() => setShowPass(p => !p)}>
                  {showPass ? '🙈' : '👁️'}
                </span>
              </div>
            </div>

            <div className="register__field">
              <label className="register__label">Confirm Password</label>
              <div className="register__input-wrap">
                <input className="register__input" type={showConf ? 'text' : 'password'}
                  placeholder="Repeat password"
                  value={confirm} onChange={e => setConfirm(e.target.value)} />
                <span className="register__eye" onClick={() => setShowConf(p => !p)}>
                  {showConf ? '🙈' : '👁️'}
                </span>
              </div>
            </div>

            <button
              className="register__btn"
              style={{ background: primary, borderColor: primary }}
              onClick={handleRegister}
              disabled={loading || success}
            >
              {loading ? 'Creating account…' : 'Create Account'}
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

        {/* Loading overlay */}
        {loading && (
          <div className="register__overlay">
            <div className="register__spinner" />
            <p className="register__overlay-text">Creating account…</p>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default RegisterPage;
