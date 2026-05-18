import React, { createContext, useContext, useState } from 'react';
import { RECENT_ORDERS as MOCK_ORDERS } from '../../config/mockData';
import { useTemplate } from '../../context/TemplateContext';
import { useHomeData } from '../../context/HomeDataContext';
import type { RecentOrder } from '../../services/homeApi';
import './RecentOrdersSection.css';

const OrdersCtx = createContext<RecentOrder[]>(MOCK_ORDERS);

const RecentOrdersSection: React.FC = () => {
  const { template } = useTemplate();
  const { data }     = useHomeData();
  const orders = (data?.recentOrders && data.recentOrders.length > 0) ? data.recentOrders : MOCK_ORDERS;

  return (
    <OrdersCtx.Provider value={orders}>
      {(() => { switch (template.id) {
        case 'luxe':    return <LuxeOrders />;
        case 'fresh':   return <FreshOrders />;
        case 'zen':     return <ZenOrders />;
        case 'fiesta':  return <FiestaOrders />;
        case 'neon':    return <NeonOrders />;
        case 'rustic':  return <RusticOrders />;
        case 'ocean':   return <OceanOrders />;
        case 'blossom': return <BlossomOrders />;
        case 'cosmic':  return <CosmicOrders />;
        case 'retro':   return <RetroOrders />;
        default:        return <FreshOrders />;
      }})()}
    </OrdersCtx.Provider>
  );
};

const LuxeOrders: React.FC = () => {
  const RECENT_ORDERS = useContext(OrdersCtx);
  const [open, setOpen] = useState(false);
  if (!RECENT_ORDERS.length) return null;
  const last = RECENT_ORDERS[0];
  return (
    <div className="section ord-wrap">
      <button className="luxe-pill" onClick={() => setOpen(true)}>
        <div className="luxe-pill__pips">
          {RECENT_ORDERS.slice(0, 4).map((o, i) => (
            <span key={i} className="luxe-pill__pip" style={{ borderColor: o.color, boxShadow: `0 0 5px ${o.color}88` }} />
          ))}
        </div>
        <div className="luxe-pill__info">
          <span className="luxe-pill__label">ORDER VAULT</span>
          <span className="luxe-pill__sub">{RECENT_ORDERS.length} {RECENT_ORDERS.length === 1 ? 'entry' : 'entries'} · {last.date}</span>
        </div>
        <span className="luxe-pill__cta">OPEN ›</span>
      </button>

      {open && (
        <>
          <div className="ord-scrim" onClick={() => setOpen(false)} />
          <div className="ord-sheet luxe-ord-sheet">
            <div className="ord-sheet__handle" />
            <div className="ord-sheet__header luxe-ord-sheet__header">
              <span className="luxe-ord-sheet__title">ORDER HISTORY</span>
              <button className="luxe-ord-sheet__close" onClick={() => setOpen(false)}>✕</button>
            </div>
            <div className="ord-sheet__body">
              {RECENT_ORDERS.map((o, i) => (
                <div key={o.id} className="luxe-order-row" style={{ animationDelay: `${i * 0.08}s` }}>
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
              <div style={{ height: 32 }} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const FreshOrders: React.FC = () => {
  const RECENT_ORDERS = useContext(OrdersCtx);
  if (!RECENT_ORDERS.length) return null;
  return (
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
};

const StreetOrders: React.FC = () => {
  const RECENT_ORDERS = useContext(OrdersCtx);
  return (
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
              {o.items.map((item, j) => <div key={j} className="street-receipt__item"><span>{item}</span></div>)}
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
};

const ZenOrders: React.FC = () => {
  const RECENT_ORDERS = useContext(OrdersCtx);
  if (!RECENT_ORDERS.length) return null;
  return (
    <div className="section">
      <h2 className="section-title">Order History</h2>
      <table className="zen-orders">
        <thead><tr className="zen-orders__head"><th>Order</th><th>Items</th><th>Total</th><th>Status</th></tr></thead>
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
};

const FiestaOrders: React.FC = () => {
  const RECENT_ORDERS = useContext(OrdersCtx);
  const [open, setOpen] = useState(false);

  const emojis   = RECENT_ORDERS.slice(0, 3).map(o => o.statusEmoji);
  const lastTotal = RECENT_ORDERS[0]?.total ?? 0;
  const inProgress = RECENT_ORDERS.filter(o => o.status === 'In Progress').length;

  return (
    <div className="section fiesta-orders-wrap">
      {/* ── Compact pill ── */}
      <button className="fiesta-pill" onClick={() => setOpen(true)}>
        <div className="fiesta-pill__emojis">
          {emojis.map((e, i) => (
            <span key={i} className="fiesta-pill__emoji" style={{ zIndex: 3 - i, marginLeft: i > 0 ? -10 : 0 }}>{e}</span>
          ))}
        </div>
        <div className="fiesta-pill__info">
          <span className="fiesta-pill__count">{RECENT_ORDERS.length} orders</span>
          {inProgress > 0
            ? <span className="fiesta-pill__live">🔴 {inProgress} in progress</span>
            : <span className="fiesta-pill__last">Last ${lastTotal.toFixed(2)}</span>
          }
        </div>
        <span className="fiesta-pill__cta">View All ›</span>
      </button>

      {/* ── Full-screen bottom sheet ── */}
      {open && (
        <>
          <div className="fiesta-scrim" onClick={() => setOpen(false)} />
          <div className="fiesta-sheet">
            <div className="fiesta-sheet__handle" />
            <div className="fiesta-sheet__header">
              <span className="fiesta-sheet__title">Recent Orders 🛍️</span>
              <button className="fiesta-sheet__close" onClick={() => setOpen(false)}>✕</button>
            </div>
            <div className="fiesta-sheet__body">
              {RECENT_ORDERS.map((o, i) => (
                <div key={o.id} className="fiesta-order-bubble" style={{ animationDelay: `${i * 0.05}s` }}>
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
              <div style={{ height: 32 }} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const NeonOrders: React.FC = () => {
  const RECENT_ORDERS = useContext(OrdersCtx);
  if (!RECENT_ORDERS.length) return null;
  return (
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
};

const RusticOrders: React.FC = () => {
  const RECENT_ORDERS = useContext(OrdersCtx);
  const [open, setOpen] = useState(false);
  if (!RECENT_ORDERS.length) return null;
  const total = RECENT_ORDERS.reduce((s, o) => s + (o.total ?? 0), 0);
  const tallyGroups = Math.floor(RECENT_ORDERS.length / 5);
  const tallyRem    = RECENT_ORDERS.length % 5;
  return (
    <div className="section ord-wrap">
      <button className="rustic-pill" onClick={() => setOpen(true)}>
        <div className="rustic-pill__inner">
          <span className="rustic-pill__heading">ORDER HISTORY</span>
          <div className="rustic-pill__row">
            <span className="rustic-pill__tally">
              {'𝍩'.repeat(tallyGroups)}{'|'.repeat(tallyRem)}
            </span>
            <span className="rustic-pill__total">Tab: ${total.toFixed(2)}</span>
          </div>
        </div>
        <span className="rustic-pill__cta">OPEN TAB ›</span>
      </button>

      {open && (
        <>
          <div className="ord-scrim" onClick={() => setOpen(false)} />
          <div className="ord-sheet rustic-ord-sheet">
            <div className="ord-sheet__handle rustic-ord-sheet__handle" />
            <div className="ord-sheet__header rustic-ord-sheet__header">
              <span className="rustic-ord-sheet__title">Your Orders</span>
              <button className="rustic-ord-sheet__close" onClick={() => setOpen(false)}>✕</button>
            </div>
            <div className="ord-sheet__body">
              {RECENT_ORDERS.map((o, i) => (
                <div key={o.id} className="rustic-order-card" style={{ animationDelay: `${i * 0.08}s` }}>
                  <div className="rustic-order-card__header">
                    <span className="rustic-order-card__id">{o.id}</span>
                    <span className="rustic-order-card__date">{o.date}</span>
                  </div>
                  <div className="rustic-order-card__items">
                    {(o.items ?? []).map((item, j) => <span key={j} className="rustic-order-card__item">{item}</span>)}
                  </div>
                  <div className="rustic-order-card__footer">
                    <span className="rustic-order-card__status" style={{ color: o.color }}>{o.status}</span>
                    <span className="rustic-order-card__total">${o.total.toFixed(2)}</span>
                  </div>
                </div>
              ))}
              <div style={{ height: 32 }} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const OceanOrders: React.FC = () => {
  const RECENT_ORDERS = useContext(OrdersCtx);
  const [open, setOpen] = useState(false);
  if (!RECENT_ORDERS.length) return null;
  const inProgress = RECENT_ORDERS.filter(o => o.status === 'In Progress').length;
  const lastTotal  = RECENT_ORDERS[0]?.total ?? 0;
  return (
    <div className="section ord-wrap">
      <button className="ocean-pill" onClick={() => setOpen(true)}>
        <span className="ocean-pill__wave-icon">🌊</span>
        <div className="ocean-pill__info">
          <span className="ocean-pill__count">{RECENT_ORDERS.length} orders</span>
          <span className="ocean-pill__sub">
            {inProgress > 0 ? `${inProgress} incoming 🚢` : `Last $${lastTotal.toFixed(2)}`}
          </span>
        </div>
        <span className="ocean-pill__cta">Dive in ›</span>
        <div className="ocean-pill__wave" />
      </button>

      {open && (
        <>
          <div className="ord-scrim" onClick={() => setOpen(false)} />
          <div className="ord-sheet ocean-ord-sheet">
            <div className="ocean-ord-sheet__wave-header">
              <div className="ord-sheet__handle ocean-ord-sheet__handle" />
              <div className="ord-sheet__header ocean-ord-sheet__header">
                <span className="ocean-ord-sheet__title">Recent Orders 🌊</span>
                <button className="ocean-ord-sheet__close" onClick={() => setOpen(false)}>✕</button>
              </div>
            </div>
            <div className="ord-sheet__body">
              {RECENT_ORDERS.map((o, i) => (
                <div key={o.id} className="ocean-order-card" style={{ animationDelay: `${i * 0.07}s` }}>
                  <div className="ocean-order-card__header">
                    <span className="ocean-order-card__id">{o.id}</span>
                    <span className="ocean-order-card__status" style={{ color: o.color }}>{o.status}</span>
                  </div>
                  <div className="ocean-order-card__items">
                    {(o.items ?? []).map((item, j) => <span key={j} className="ocean-order-card__item">{item}</span>)}
                  </div>
                  <div className="ocean-order-card__footer">
                    <span className="ocean-order-card__date">{o.date}</span>
                    <span className="ocean-order-card__total">${o.total.toFixed(2)}</span>
                  </div>
                </div>
              ))}
              <div style={{ height: 32 }} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const BlossomOrders: React.FC = () => {
  const RECENT_ORDERS = useContext(OrdersCtx);
  const [open, setOpen] = useState(false);
  if (!RECENT_ORDERS.length) return null;
  const lastTotal = RECENT_ORDERS[0]?.total ?? 0;
  const PETALS = ['🌸', '🌺', '🌸'];
  return (
    <div className="section ord-wrap">
      <button className="blossom-pill" onClick={() => setOpen(true)}>
        <div className="blossom-pill__petals">
          {PETALS.map((e, i) => (
            <span key={i} className="blossom-pill__petal" style={{ marginLeft: i > 0 ? -10 : 0, zIndex: 3 - i }}>{e}</span>
          ))}
        </div>
        <div className="blossom-pill__info">
          <span className="blossom-pill__label">My Orders</span>
          <span className="blossom-pill__sub">last · ${lastTotal.toFixed(2)}</span>
        </div>
        <span className="blossom-pill__cta">♡ View</span>
      </button>

      {open && (
        <>
          <div className="ord-scrim" onClick={() => setOpen(false)} />
          <div className="ord-sheet blossom-ord-sheet">
            <div className="blossom-ord-sheet__top" />
            <div className="ord-sheet__handle blossom-ord-sheet__handle" />
            <div className="ord-sheet__header blossom-ord-sheet__header">
              <span className="blossom-ord-sheet__title">My Orders 🌸</span>
              <button className="blossom-ord-sheet__close" onClick={() => setOpen(false)}>✕</button>
            </div>
            <div className="ord-sheet__body">
              {RECENT_ORDERS.map((o, i) => (
                <div key={o.id} className="blossom-order-card" style={{ animationDelay: `${i * 0.07}s` }}>
                  <div className="blossom-order-card__header">
                    <span className="blossom-order-card__id">{o.id}</span>
                    <span className="blossom-order-card__status" style={{ color: o.color }}>{o.statusEmoji} {o.status}</span>
                  </div>
                  <div className="blossom-order-card__items">
                    {(o.items ?? []).map((item, j) => <span key={j} className="blossom-order-card__item">{item}</span>)}
                  </div>
                  <div className="blossom-order-card__footer">
                    <span className="blossom-order-card__date">{o.date}</span>
                    <span className="blossom-order-card__total">${o.total.toFixed(2)}</span>
                  </div>
                </div>
              ))}
              <div style={{ height: 32 }} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const EmberOrders: React.FC = () => {
  const RECENT_ORDERS = useContext(OrdersCtx);
  return (
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
};

const CosmicOrders: React.FC = () => {
  const RECENT_ORDERS = useContext(OrdersCtx);
  const [open, setOpen] = useState(false);
  if (!RECENT_ORDERS.length) return null;
  const totalSpend = RECENT_ORDERS.reduce((s, o) => s + (o.total ?? 0), 0);
  const active = RECENT_ORDERS.filter(o => o.status === 'In Progress').length;
  return (
    <div className="section ord-wrap">
      <button className="cosmic-pill" onClick={() => setOpen(true)}>
        <div className="cosmic-pill__scanner">
          <span className="cosmic-pill__beam" />
        </div>
        <div className="cosmic-pill__info">
          <span className="cosmic-pill__label">MISSION LOG</span>
          <span className="cosmic-pill__data">
            {RECENT_ORDERS.length} ORDERS &nbsp;·&nbsp; ${totalSpend.toFixed(2)}
            {active > 0 && <span className="cosmic-pill__active"> · {active} ACTIVE</span>}
          </span>
        </div>
        <span className="cosmic-pill__cta">[ACCESS ▶]</span>
      </button>

      {open && (
        <>
          <div className="ord-scrim" onClick={() => setOpen(false)} />
          <div className="ord-sheet cosmic-ord-sheet">
            <div className="ord-sheet__handle cosmic-ord-sheet__handle" />
            <div className="ord-sheet__header cosmic-ord-sheet__header">
              <span className="cosmic-ord-sheet__title">MISSION LOG</span>
              <button className="cosmic-ord-sheet__close" onClick={() => setOpen(false)}>[✕]</button>
            </div>
            <div className="ord-sheet__body">
              {RECENT_ORDERS.map((o, i) => (
                <div key={o.id} className="cosmic-order-card" style={{ animationDelay: `${i * 0.07}s` }}>
                  <div className="cosmic-order-card__header">
                    <span className="cosmic-order-card__id">{o.id}</span>
                    <span className="cosmic-order-card__status" style={{ color: o.color }}>{o.status}</span>
                  </div>
                  <div className="cosmic-order-card__items">&gt;&gt; {(o.items ?? []).join(' · ')}</div>
                  <div className="cosmic-order-card__footer">
                    <span className="cosmic-order-card__date">{o.date}</span>
                    <span className="cosmic-order-card__total">${o.total.toFixed(2)}</span>
                  </div>
                </div>
              ))}
              <div style={{ height: 32 }} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const RetroOrders: React.FC = () => {
  const RECENT_ORDERS = useContext(OrdersCtx);
  const [open, setOpen] = useState(false);
  if (!RECENT_ORDERS.length) return null;
  const grandTotal = RECENT_ORDERS.reduce((s, o) => s + (o.total ?? 0), 0);
  return (
    <div className="section ord-wrap">
      <button className="retro-pill" onClick={() => setOpen(true)}>
        <div className="retro-pill__perf retro-pill__perf--top" />
        <div className="retro-pill__body">
          <span className="retro-pill__heading">BILL HISTORY</span>
          <div className="retro-pill__row">
            <span className="retro-pill__count">x{RECENT_ORDERS.length} checks</span>
            <span className="retro-pill__total">TOTAL ${grandTotal.toFixed(2)}</span>
          </div>
        </div>
        <span className="retro-pill__cta">VIEW TAB ›</span>
        <div className="retro-pill__perf retro-pill__perf--bottom" />
      </button>

      {open && (
        <>
          <div className="ord-scrim" onClick={() => setOpen(false)} />
          <div className="ord-sheet retro-ord-sheet">
            <div className="retro-ord-sheet__perf" />
            <div className="ord-sheet__handle retro-ord-sheet__handle" />
            <div className="ord-sheet__header retro-ord-sheet__header">
              <span className="retro-ord-sheet__title">Check History</span>
              <button className="retro-ord-sheet__close" onClick={() => setOpen(false)}>✕</button>
            </div>
            <div className="ord-sheet__body">
              {RECENT_ORDERS.map((o, i) => (
                <div key={o.id} className="retro-order-card" style={{ animationDelay: `${i * 0.07}s` }}>
                  <div className="retro-order-card__header">
                    <span className="retro-order-card__id">{o.id}</span>
                    <span className="retro-order-card__date">{o.date}</span>
                  </div>
                  <div className="retro-order-card__items">
                    {(o.items ?? []).map((item, j) => <span key={j} className="retro-order-card__item">{item}</span>)}
                  </div>
                  <div className="retro-order-card__footer">
                    <span className="retro-order-card__status" style={{ color: o.color }}>{o.status}</span>
                    <span className="retro-order-card__total">${o.total.toFixed(2)}</span>
                  </div>
                </div>
              ))}
              <div style={{ height: 32 }} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RecentOrdersSection;
