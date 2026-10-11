import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { X, CheckCircle2, AlertTriangle, Info, XCircle, Inbox, Star, CreditCard, Wallet, Landmark, Smartphone, Loader2, ShieldCheck } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { initials, fmtMoney } from '../utils';
import type { PaymentMethod, User } from '../types';

export function Modal({ title, onClose, children, footer, wide }: { title: ReactNode; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog">
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Đóng" id="modal-close">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export const Badge = ({ color = 'gray', children, plain }: { color?: string; children: ReactNode; plain?: boolean }) => (
  <span className={`badge b-${color} ${plain ? 'plain' : ''}`}>{children}</span>
);

export function Avatar({ user, size }: { user?: Pick<User, 'fullName' | 'avatarColor'>; size?: 'sm' | 'lg' }) {
  if (!user) return <div className={`avatar ${size ?? ''}`} style={{ background: '#333' }}>?</div>;
  return (
    <div className={`avatar ${size ?? ''}`} style={{ background: `linear-gradient(135deg, ${user.avatarColor}, ${user.avatarColor}99)` }}>
      {initials(user.fullName)}
    </div>
  );
}

export function StatCard({ icon, label, value, color = '#7c5cff', trend, sub }: { icon: ReactNode; label: string; value: ReactNode; color?: string; trend?: { v: string; up: boolean }; sub?: ReactNode }) {
  return (
    <div className="card stat hover" style={{ ['--c' as string]: color }}>
      <div className="icon" style={{ background: `${color}22`, color }}>
        {icon}
      </div>
      {trend && (
        <span className="trend" style={{ background: trend.up ? 'rgba(46,212,122,.14)' : 'rgba(255,77,109,.14)', color: trend.up ? '#5ef0a0' : '#ff8aa0' }}>
          {trend.up ? '▲' : '▼'} {trend.v}
        </span>
      )}
      <div className="value">{value}</div>
      <div className="label">{label}</div>
      {sub && <div className="small dim mt8">{sub}</div>}
    </div>
  );
}

export const Empty = ({ text, icon }: { text: string; icon?: ReactNode }) => (
  <div className="empty">
    {icon ?? <Inbox size={40} />}
    <div>{text}</div>
  </div>
);

export const PageHead = ({ title, desc, actions }: { title: ReactNode; desc?: ReactNode; actions?: ReactNode }) => (
  <div className="page-head">
    <div>
      <h1>{title}</h1>
      {desc && <p>{desc}</p>}
    </div>
    {actions && <div className="row wrap">{actions}</div>}
  </div>
);

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: ReactNode; count?: number }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="tabs">
      {tabs.map((t) => (
        <button key={t.id} id={`tab-${t.id}`} className={`tab ${value === t.id ? 'on' : ''}`} onClick={() => onChange(t.id)}>
          {t.label}
          {!!t.count && <span className="count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Stars({ value, onChange, size = 16 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  return (
    <span className="stars">
      {[1, 2, 3, 4, 5].map((i) =>
        onChange ? (
          <button key={i} type="button" onClick={() => onChange(i)} aria-label={`${i} sao`}>
            <Star size={size} fill={i <= value ? 'currentColor' : 'none'} />
          </button>
        ) : (
          <Star key={i} size={size} fill={i <= Math.round(value) ? 'currentColor' : 'none'} />
        ),
      )}
    </span>
  );
}

export function Toasts() {
  const { toasts } = useApp();
  const map = {
    success: { c: '#2ed47a', i: <CheckCircle2 size={20} /> },
    error: { c: '#ff4d6d', i: <XCircle size={20} /> },
    warning: { c: '#ffb020', i: <AlertTriangle size={20} /> },
    info: { c: '#3fa9ff', i: <Info size={20} /> },
  };
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <div key={t.id} className="toast" style={{ ['--c' as string]: map[t.type].c }}>
          {map[t.type].i}
          <div>{t.message}</div>
        </div>
      ))}
    </div>
  );
}

export const Progress = ({ value, color }: { value: number; color?: string }) => (
  <div className="progress">
    <div style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
  </div>
);

/** Mã QR giả lập (pattern xác định theo chuỗi) */
export function FakeQR({ text, size = 140 }: { text: string; size?: number }) {
  const n = 25;
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const cells: boolean[] = [];
  for (let i = 0; i < n * n; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    cells.push(((h >> 16) & 1) === 1);
  }
  const finder = (x: number, y: number) => {
    const inBox = (ox: number, oy: number) => x >= ox && x < ox + 7 && y >= oy && y < oy + 7;
    for (const [ox, oy] of [[0, 0], [n - 7, 0], [0, n - 7]]) {
      if (inBox(ox, oy)) {
        const dx = x - ox, dy = y - oy;
        return dx === 0 || dy === 0 || dx === 6 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4) ? 1 : 0;
      }
    }
    return -1;
  };
  const s = size / n;
  return (
    <div className="qr">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {Array.from({ length: n * n }).map((_, i) => {
          const x = i % n, y = Math.floor(i / n);
          const f = finder(x, y);
          const on = f === -1 ? cells[i] : f === 1;
          return on ? <rect key={i} x={x * s} y={y * s} width={s + 0.3} height={s + 0.3} fill="#0b0d17" /> : null;
        })}
      </svg>
    </div>
  );
}

/* ---------------- Payment gateway mô phỏng ---------------- */
const METHODS: { id: PaymentMethod; name: string; icon: ReactNode; color: string }[] = [
  { id: 'momo', name: 'Ví MoMo', icon: <Smartphone size={20} />, color: '#d82d8b' },
  { id: 'vnpay', name: 'VNPay QR', icon: <Wallet size={20} />, color: '#0a6ebd' },
  { id: 'card', name: 'Thẻ Visa/Master', icon: <CreditCard size={20} />, color: '#7c5cff' },
  { id: 'banking', name: 'Internet Banking', icon: <Landmark size={20} />, color: '#00a37a' },
];

export function PaymentModal({ title, amount, lines, onClose, onPay }: { title: string; amount: number; lines?: [string, string][]; onClose: () => void; onPay: (method: PaymentMethod, success: boolean) => void }) {
  const [method, setMethod] = useState<PaymentMethod>('momo');
  const [processing, setProcessing] = useState<null | boolean>(null);
  const go = (success: boolean) => {
    setProcessing(success);
    setTimeout(() => onPay(method, success), 1100);
  };
  return (
    <Modal title="Thanh toán online" onClose={onClose}>
      <div className="card" style={{ background: 'rgba(124,92,255,.08)' }}>
        <div className="small muted">Đơn hàng</div>
        <h3 className="mt8">{title}</h3>
        {lines?.map(([k, v]) => (
          <div className="kv" key={k}>
            <span>{k}</span>
            <span>{v}</span>
          </div>
        ))}
        <div className="divider" />
        <div className="row between">
          <span className="muted">Tổng thanh toán</span>
          <span style={{ fontSize: 24, fontWeight: 800 }} className="grad-text">
            {fmtMoney(amount)}
          </span>
        </div>
      </div>
      <div className="small muted mt16 mb16 bold">Chọn phương thức</div>
      <div className="grid g2" style={{ gap: 10 }}>
        {METHODS.map((m) => (
          <button key={m.id} id={`pay-${m.id}`} className={`slot-btn ${method === m.id ? 'on' : ''}`} onClick={() => setMethod(m.id)} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ color: m.color }}>{m.icon}</span>
            {m.name}
          </button>
        ))}
      </div>
      <div className="row small dim mt16">
        <ShieldCheck size={16} /> Môi trường demo – chọn kết quả giao dịch để mô phỏng cổng thanh toán.
      </div>
      <div className="row mt16">
        <button className="btn danger grow" disabled={processing !== null} onClick={() => go(false)} id="pay-fail">
          {processing === false ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <XCircle size={16} />} Mô phỏng thất bại
        </button>
        <button className="btn primary grow" disabled={processing !== null} onClick={() => go(true)} id="pay-success">
          {processing === true ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={16} />} Thanh toán {fmtMoney(amount)}
        </button>
      </div>
    </Modal>
  );
}

/** Modal nhập lý do (dùng cho từ chối, hủy...) */
export function ReasonModal({ title, label, confirmText, danger, onClose, onConfirm, required }: { title: string; label: string; confirmText: string; danger?: boolean; required?: boolean; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [v, setV] = useState('');
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Hủy
          </button>
          <button className={`btn ${danger ? 'danger' : 'primary'}`} disabled={required && !v.trim()} onClick={() => onConfirm(v.trim())} id="reason-confirm">
            {confirmText}
          </button>
        </>
      }
    >
      <div className="field">
        <label>{label}</label>
        <textarea className="input" value={v} onChange={(e) => setV(e.target.value)} autoFocus id="reason-input" />
      </div>
    </Modal>
  );
}

export function ConfirmModal({ title, message, confirmText = 'Xác nhận', danger, onClose, onConfirm }: { title: string; message: ReactNode; confirmText?: string; danger?: boolean; onClose: () => void; onConfirm: () => void }) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Quay lại
          </button>
          <button className={`btn ${danger ? 'danger' : 'primary'}`} onClick={onConfirm} id="confirm-ok">
            {confirmText}
          </button>
        </>
      }
    >
      <div className="muted">{message}</div>
    </Modal>
  );
}
