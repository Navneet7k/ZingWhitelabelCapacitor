import React from 'react';
import { RECENT_ORDERS } from '../../config/mockData';
import { useTemplate } from '../../context/TemplateContext';
import './RecentOrdersSection.css';

const RecentOrdersSection: React.FC = () => {
  const { template } = useTemplate();
  switch (template.id) {
    case 'luxe':   return <LuxeOrders />;
    case 'fresh':  return <FreshOrders />;
    case 'street': return <StreetOrders />;
    case 'zen':    return <ZenOrders />;
    case 'fiesta': return <FiestaOrders />;
    default:       return <FreshOrders />;
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

export default RecentOrdersSection;
