import React from 'react';
import { RECENT_ORDERS } from '../../config/mockData';
import { useTemplate } from '../../context/TemplateContext';
import './RecentOrdersSection.css';

const RecentOrdersSection: React.FC = () => {
  const { template } = useTemplate();
  switch (template.id) {
    case 'luxe':    return <LuxeOrders />;
    case 'fresh':   return <FreshOrders />;
    case 'street':  return <StreetOrders />;
    case 'zen':     return <ZenOrders />;
    case 'fiesta':  return <FiestaOrders />;
    case 'neon':    return <NeonOrders />;
    case 'rustic':  return <RusticOrders />;
    case 'ocean':   return <OceanOrders />;
    case 'blossom': return <BlossomOrders />;
    case 'ember':   return <EmberOrders />;
    default:        return <FreshOrders />;
  }
};

/* ── LUXE: Vertical timeline ── */
const LuxeOrders: React.FC = () => (
  <div className="section">
    <h2 className="section-title">Recent Orders</h2>
    <div className="luxe-orders">
      {RECENT_ORDERS.map((o, i) => (
        <div key={o.id} className="luxe-order-row" style={{ animationDelay: `${i * 0.1}s` }}>
          <div className="luxe-order-row__line-wrap">
            <div className="luxe-order-row__dot" style={{ borderColor: o.color }} />
            {i < RECENT_ORDERS.length - 1 && <div className="luxe-order-row__line" />}
          </div>
          <div className="luxe-order-row__body">
            <div className="luxe-order-row__top">
              <span className="luxe-order-row__id">{o.id}</span>
              <span className="luxe-order-row__status" style={{ color: o.color }}>{o.status}</span>
            </div>
            <p className="luxe-order-row__items">{o.items.join(' · ')}</p>
            <div className="luxe-order-row__bottom">
              <span className="luxe-order-row__date">{o.date}</span>
              <span className="luxe-order-row__total">${o.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

/* ── FRESH: Horizontal scroll chips ── */
const FreshOrders: React.FC = () => (
  <div className="section">
    <h2 className="section-title">Recent Orders</h2>
    <div className="fresh-orders__track">
      {RECENT_ORDERS.map((o, i) => (
        <div key={o.id} className="fresh-order-chip" style={{ animationDelay: `${i * 0.07}s` }}>
          <div className="fresh-order-chip__header">
            <span className="fresh-order-chip__id">{o.id}</span>
            <span className="fresh-order-chip__dot" style={{ background: o.color }} />
          </div>
          <p className="fresh-order-chip__items">{o.items.slice(0, 2).join(', ')}{o.items.length > 2 ? '…' : ''}</p>
          <div className="fresh-order-chip__footer">
            <span className="fresh-order-chip__total">${o.total.toFixed(2)}</span>
            <span className="fresh-order-chip__status" style={{ color: o.color }}>{o.status}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

/* ── STREET: Receipt / ticket cards ── */
const StreetOrders: React.FC = () => (
  <div className="section">
    <h2 className="section-title">Your Orders</h2>
    <div className="street-orders__list">
      {RECENT_ORDERS.slice(0, 3).map((o, i) => (
        <div key={o.id} className="street-receipt" style={{ animationDelay: `${i * 0.08}s` }}>
          <div className="street-receipt__top">
            <span className="street-receipt__id">{o.id}</span>
            <span className="street-receipt__date">{o.date}</span>
          </div>
          <div className="street-receipt__tear" />
          <div className="street-receipt__body">
            {o.items.map((item, j) => (
              <div key={j} className="street-receipt__item">
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div className="street-receipt__tear" />
          <div className="street-receipt__bottom">
            <span className="street-receipt__status" style={{ color: o.color }}>{o.status}</span>
            <span className="street-receipt__total">TOTAL: ${o.total.toFixed(2)}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

/* ── ZEN: Clean table rows ── */
const ZenOrders: React.FC = () => (
  <div className="section">
    <h2 className="section-title">Order History</h2>
    <table className="zen-orders">
      <thead>
        <tr className="zen-orders__head">
          <th>Order</th>
          <th>Items</th>
          <th>Total</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {RECENT_ORDERS.map((o, i) => (
          <tr key={o.id} className="zen-orders__row" style={{ animationDelay: `${i * 0.1}s` }}>
            <td className="zen-orders__id">{o.id}</td>
            <td className="zen-orders__items">{o.items.length} items</td>
            <td className="zen-orders__total">${o.total.toFixed(2)}</td>
            <td><span className="zen-orders__status" style={{ color: o.color }}>{o.status}</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/* ── FIESTA: Bubble chat-style cards ── */
const FiestaOrders: React.FC = () => (
  <div className="section">
    <h2 className="section-title">Recent Orders 🛍️</h2>
    <div className="fiesta-orders__list">
      {RECENT_ORDERS.map((o, i) => (
        <div key={o.id} className="fiesta-order-bubble" style={{ animationDelay: `${i * 0.08}s` }}>
          <div className="fiesta-order-bubble__icon">{o.statusEmoji}</div>
          <div className="fiesta-order-bubble__body">
            <div className="fiesta-order-bubble__header">
              <span className="fiesta-order-bubble__id">{o.id}</span>
              <span className="fiesta-order-bubble__total">${o.total.toFixed(2)}</span>
            </div>
            <p className="fiesta-order-bubble__items">{o.items.join(' · ')}</p>
            <div className="fiesta-order-bubble__footer">
              <span className="fiesta-order-bubble__status" style={{ background: o.color }}>{o.status}</span>
              <span className="fiesta-order-bubble__date">{o.date}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const NeonOrders: React.FC = () => (
  <div className="section"><h2 className="section-title">ORDERS.LOG</h2>
    <div className="neon-orders__list">
      {RECENT_ORDERS.map((o, i) => (
        <div key={o.id} className="neon-order-card" style={{ animationDelay: `${i * 0.07}s` }}>
          <div className="neon-order-card__header"><span className="neon-order-card__id">{o.id}</span><span className="neon-order-card__status" style={{ color: o.color }}>{o.status}</span></div>
          <div className="neon-order-card__items">&gt; {o.items.join(' · ')}</div>
          <div className="neon-order-card__footer"><span className="neon-order-card__date">{o.date}</span><span className="neon-order-card__total">${o.total.toFixed(2)}</span></div>
        </div>
      ))}
    </div>
  </div>
);

const RusticOrders: React.FC = () => (
  <div className="section"><h2 className="section-title">Your Orders</h2>
    <div className="rustic-orders__list">
      {RECENT_ORDERS.slice(0,3).map((o, i) => (
        <div key={o.id} className="rustic-order-card" style={{ animationDelay: `${i * 0.08}s` }}>
          <div className="rustic-order-card__header"><span className="rustic-order-card__id">{o.id}</span><span className="rustic-order-card__date">{o.date}</span></div>
          <div className="rustic-order-card__items">{o.items.map((item, j) => <span key={j} className="rustic-order-card__item">{item}</span>)}</div>
          <div className="rustic-order-card__footer"><span className="rustic-order-card__status" style={{ color: o.color }}>{o.status}</span><span className="rustic-order-card__total">${o.total.toFixed(2)}</span></div>
        </div>
      ))}
    </div>
  </div>
);

const OceanOrders: React.FC = () => (
  <div className="section"><h2 className="section-title">Recent Orders</h2>
    <div className="ocean-orders__list">
      {RECENT_ORDERS.map((o, i) => (
        <div key={o.id} className="ocean-order-card" style={{ animationDelay: `${i * 0.07}s` }}>
          <div className="ocean-order-card__header"><span className="ocean-order-card__id">{o.id}</span><span className="ocean-order-card__status" style={{ color: o.color }}>{o.status}</span></div>
          <div className="ocean-order-card__items">{o.items.map((item, j) => <span key={j} className="ocean-order-card__item">{item}</span>)}</div>
          <div className="ocean-order-card__footer"><span className="ocean-order-card__date">{o.date}</span><span className="ocean-order-card__total">${o.total.toFixed(2)}</span></div>
        </div>
      ))}
    </div>
  </div>
);

const BlossomOrders: React.FC = () => (
  <div className="section"><h2 className="section-title">My Orders</h2>
    <div className="blossom-orders__list">
      {RECENT_ORDERS.map((o, i) => (
        <div key={o.id} className="blossom-order-card" style={{ animationDelay: `${i * 0.07}s` }}>
          <div className="blossom-order-card__header"><span className="blossom-order-card__id">{o.id}</span><span className="blossom-order-card__status" style={{ color: o.color }}>{o.statusEmoji} {o.status}</span></div>
          <div className="blossom-order-card__items">{o.items.map((item, j) => <span key={j} className="blossom-order-card__item">{item}</span>)}</div>
          <div className="blossom-order-card__footer"><span className="blossom-order-card__date">{o.date}</span><span className="blossom-order-card__total">${o.total.toFixed(2)}</span></div>
        </div>
      ))}
    </div>
  </div>
);

const EmberOrders: React.FC = () => (
  <div className="section"><h2 className="section-title">YOUR ORDERS</h2>
    <div className="ember-orders__list">
      {RECENT_ORDERS.slice(0,3).map((o, i) => (
        <div key={o.id} className="ember-order-card" style={{ animationDelay: `${i * 0.07}s` }}>
          <div className="ember-order-card__header"><span className="ember-order-card__id">{o.id}</span><span className="ember-order-card__status" style={{ color: o.color }}>{o.status}</span></div>
          <div className="ember-order-card__items">{o.items.map((item, j) => <span key={j} className="ember-order-card__item">{item}</span>)}</div>
          <div className="ember-order-card__footer"><span className="ember-order-card__date">{o.date}</span><span className="ember-order-card__total">${o.total.toFixed(2)}</span></div>
        </div>
      ))}
    </div>
  </div>
);

export default RecentOrdersSection;
