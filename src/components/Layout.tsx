import { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { NavLink, Outlet, useNavigate, Navigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, User as UserIcon, Activity, CreditCard, CalendarDays, Dumbbell, ClipboardList, QrCode, Receipt, Wrench, Bell,
  LogOut, Menu, CalendarClock, Inbox, Star, ScanLine, Snowflake, History, Users, Building2, Package, BarChart3, Settings, RotateCcw,
  CheckCircle2, AlertTriangle, Info, XCircle, KeyRound, Zap, Sun, Moon, BookOpen,
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { Avatar, Badge } from './ui';
import { roleLabel } from './labels';
import { timeAgo } from '../utils';
import type { Role, Notification } from '../types';

interface NavItem { to: string; label: string; icon: ReactNode; count?: number; end?: boolean }

function useNav(role: Role): { section: string; items: NavItem[] }[] {
  const { db, user } = useApp();
  const unreadPT = db.ptBookings.filter((b) => b.trainerId === user?.id && b.status === 'pending').length;
  const pendingFreeze = db.freezeRequests.filter((f) => f.status === 'pending').length;
  const pendingEq = db.equipmentReports.filter((r) => r.status === 'pending' && (!user?.branchId || r.branchId === user.branchId)).length;
  const s = 18;
  switch (role) {
    case 'member':
      return [
        { section: 'Tổng quan', items: [
          { to: '/member', label: 'Trang chủ', icon: <LayoutDashboard size={s} />, end: true },
          { to: '/member/card', label: 'Thẻ hội viên', icon: <QrCode size={s} /> },
        ] },
        { section: 'Tập luyện', items: [
          { to: '/member/classes', label: 'Lớp học nhóm', icon: <CalendarDays size={s} /> },
          { to: '/member/pt', label: 'Đặt lịch PT', icon: <Dumbbell size={s} /> },
          { to: '/member/bookings', label: 'Lịch của tôi', icon: <ClipboardList size={s} /> },
          { to: '/member/progress', label: 'Tiến độ & chỉ số', icon: <Activity size={s} /> },
          { to: '/member/rules', label: 'Nội quy phòng gym', icon: <BookOpen size={s} /> },
        ] },
        { section: 'Tài khoản', items: [
          { to: '/member/memberships', label: 'Gói tập', icon: <CreditCard size={s} /> },
          { to: '/member/payments', label: 'Lịch sử giao dịch', icon: <Receipt size={s} /> },
          { to: '/member/equipment', label: 'Báo thiết bị hỏng', icon: <Wrench size={s} /> },
          { to: '/member/profile', label: 'Hồ sơ cá nhân', icon: <UserIcon size={s} /> },
        ] },
      ];
    case 'trainer':
      return [
        { section: 'Tổng quan', items: [{ to: '/trainer', label: 'Trang chủ', icon: <LayoutDashboard size={s} />, end: true }] },
        { section: 'Công việc', items: [
          { to: '/trainer/requests', label: 'Lịch hẹn 1-kèm-1', icon: <Inbox size={s} />, count: unreadPT },
          { to: '/trainer/availability', label: 'Lịch rảnh', icon: <CalendarClock size={s} /> },
          { to: '/trainer/classes', label: 'Lớp dạy & điểm danh', icon: <CalendarDays size={s} /> },
          { to: '/trainer/reviews', label: 'Đánh giá của tôi', icon: <Star size={s} /> },
        ] },
        { section: 'Tài khoản', items: [{ to: '/trainer/profile', label: 'Hồ sơ chuyên môn', icon: <UserIcon size={s} /> }] },
      ];
    case 'receptionist':
      return [
        { section: 'Tổng quan', items: [{ to: '/staff', label: 'Trang chủ', icon: <LayoutDashboard size={s} />, end: true }] },
        { section: 'Vận hành', items: [
          { to: '/staff/checkin', label: 'Check-in / Check-out', icon: <ScanLine size={s} /> },
          { to: '/staff/history', label: 'Lịch sử check-in', icon: <History size={s} /> },
          { to: '/staff/freeze', label: 'Yêu cầu freeze', icon: <Snowflake size={s} />, count: pendingFreeze },
          { to: '/staff/equipment', label: 'Thiết bị & sự cố', icon: <Wrench size={s} />, count: pendingEq },
          { to: '/staff/members', label: 'Tra cứu hội viên', icon: <Users size={s} /> },
        ] },
        { section: 'Tài khoản', items: [{ to: '/account', label: 'Tài khoản', icon: <KeyRound size={s} /> }] },
      ];
    case 'admin':
      return [
        { section: 'Tổng quan', items: [
          { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={s} />, end: true },
          { to: '/admin/reports', label: 'Báo cáo & thống kê', icon: <BarChart3 size={s} /> },
        ] },
        { section: 'Quản lý', items: [
          { to: '/admin/users', label: 'Tài khoản & phân quyền', icon: <Users size={s} /> },
          { to: '/admin/branches', label: 'Chi nhánh', icon: <Building2 size={s} /> },
          { to: '/admin/plans', label: 'Danh mục gói tập', icon: <Package size={s} /> },
          { to: '/admin/classes', label: 'Lớp học nhóm', icon: <CalendarDays size={s} /> },
          { to: '/admin/equipment', label: 'Thiết bị', icon: <Wrench size={s} />, count: pendingEq },
          { to: '/admin/checkins', label: 'Lịch sử check-in', icon: <History size={s} /> },
          { to: '/admin/settings', label: 'Cấu hình hệ thống', icon: <Settings size={s} /> },
        ] },
      ];
  }
}

export const ntfStyle: Record<Notification['type'], { c: string; i: ReactNode }> = {
  success: { c: '#2ed47a', i: <CheckCircle2 size={17} /> },
  warning: { c: '#ffb020', i: <AlertTriangle size={17} /> },
  danger: { c: '#ff4d6d', i: <XCircle size={17} /> },
  info: { c: '#3fa9ff', i: <Info size={17} /> },
};

function NotificationBell() {
  const { db, user, act } = useApp();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const list = db.notifications.filter((n) => n.userId === user?.id);
  const unread = list.filter((n) => !n.read).length;
  useEffect(() => {
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const markAll = () => act((d) => d.notifications.forEach((n) => n.userId === user?.id && (n.read = true)));
  const openN = (n: Notification) => {
    act((d) => {
      const x = d.notifications.find((y) => y.id === n.id);
      if (x) x.read = true;
    });
    setOpen(false);
    if (n.link) nav(n.link);
  };
  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="icon-btn" onClick={() => setOpen(!open)} id="notification-bell" aria-label="Thông báo">
        <Bell size={18} />
        {unread > 0 && <span className="dot">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="dropdown">
          <div className="row between" style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <h3>Thông báo</h3>
            <button className="btn ghost sm" onClick={markAll} disabled={!unread}>Đánh dấu đã đọc</button>
          </div>
          {list.length === 0 && <div className="empty">Chưa có thông báo</div>}
          {list.slice(0, 8).map((n) => (
            <div key={n.id} className={`ntf-item ${n.read ? '' : 'unread'}`} onClick={() => openN(n)}>
              <div className="ntf-icon" style={{ background: ntfStyle[n.type].c + '22', color: ntfStyle[n.type].c }}>{ntfStyle[n.type].i}</div>
              <div style={{ minWidth: 0 }}>
                <div className="bold" style={{ fontSize: 13.5 }}>{n.title}</div>
                <div className="small muted">{n.message}</div>
                <div className="small dim mt8" style={{ marginTop: 4 }}>{timeAgo(n.createdAt)}</div>
              </div>
            </div>
          ))}
          <button className="btn ghost block" style={{ borderRadius: 0, padding: 12 }} onClick={() => { setOpen(false); nav('/notifications'); }}>
            Xem tất cả thông báo
          </button>
        </div>
      )}
    </div>
  );
}

export function Layout({ role }: { role: Role }) {
  const { user, logout, reset, db, theme, toggleTheme } = useApp();
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const sections = useNav(role);
  useEffect(() => setOpen(false), [loc.pathname]);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={homeOf(user.role)} replace />;
  const branch = db.branches.find((b) => b.id === user.branchId);
  return (
    <div className="app">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-logo"><Zap size={22} color="#fff" fill="#fff" /></div>
          <div>
            <div className="brand-name">DFGym<span className="grad-text">Center</span></div>
            <div className="brand-sub">{roleLabel[role][0]}</div>
          </div>
        </div>
        <nav className="nav">
          {sections.map((sec) => (
            <div key={sec.section}>
              <div className="nav-section">{sec.section}</div>
              {sec.items.map((it) => (
                <NavLink key={it.to} to={it.to} end={it.end} id={`nav-${it.to.replace(/\//g, '-').slice(1)}`}>
                  {it.icon}
                  {it.label}
                  {!!it.count && <span className="count">{it.count}</span>}
                </NavLink>
              ))}
            </div>
          ))}
          <div className="nav-section">Khác</div>
          <NavLink to="/notifications"><Bell size={18} />Thông báo</NavLink>
        </nav>
        <div className="sidebar-foot col">
          <button className="btn ghost sm" style={{ justifyContent: 'flex-start' }} onClick={reset} id="reset-demo">
            <RotateCcw size={15} /> Khôi phục dữ liệu demo
          </button>
          <button className="btn ghost sm" style={{ justifyContent: 'flex-start' }} onClick={() => { logout(); nav('/login'); }} id="logout-btn">
            <LogOut size={15} /> Đăng xuất
          </button>
        </div>
      </aside>
      <div className={`backdrop-mobile ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />
      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setOpen(true)} aria-label="Menu"><Menu size={18} /></button>
          <div className="small muted">
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
          </div>
          {branch && <Badge color="purple">{branch.name}</Badge>}
          <div className="spacer" />
          <button
            className="icon-btn theme-toggle-btn"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Chuyển sang giao diện tối' : 'Chuyển sang giao diện sáng'}
            aria-label="Đổi theme"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} color="#ffb020" />}
          </button>
          <NotificationBell />
          <div className="row" style={{ gap: 10 }}>
            <Avatar user={user} />
            <div style={{ lineHeight: 1.25 }}>
              <div className="bold" style={{ fontSize: 13.5 }}>{user.fullName}</div>
              <div className="small dim">{user.email}</div>
            </div>
          </div>
        </header>
        <main className="content" key={loc.pathname}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export const homeOf = (r: Role) => ({ member: '/member', trainer: '/trainer', receptionist: '/staff', admin: '/admin' })[r];

/** Layout dùng chung cho các trang mọi vai trò (thông báo, tài khoản) */
export function SharedLayout() {
  const { user } = useApp();
  if (!user) return <Navigate to="/login" replace />;
  return <Layout role={user.role} />;
}
