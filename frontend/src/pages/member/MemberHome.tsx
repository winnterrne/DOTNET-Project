import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { CalendarDays, Dumbbell, QrCode, Flame, Timer, CreditCard, ArrowRight, Sparkles, Activity, AlertTriangle } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import * as L from '../../store/logic';
import { Badge, StatCard, Empty, Progress } from '../../components/ui';
import { mStatusLabel, cbLabel, ptbLabel } from '../../components/labels';
import { fmtDate, fmtTime, diffDays, todayStr, fmtWeekday } from '../../utils';

export function useMemberData() {
  const { db, user } = useApp();
  return useMemo(() => {
    const uid = user!.id;
    const ms = db.memberships.filter((m) => m.memberId === uid).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const current = L.membershipOn(db, uid);
    const latest = L.latestPaidMembership(db, uid);
    const balance = L.ptBalance(db, uid);
    const now = Date.now();
    const upcomingClass = db.classBookings
      .filter((b) => b.memberId === uid && ['booked', 'waitlist'].includes(b.status))
      .map((b) => ({ b, s: L.sessionById(db, b.sessionId)! }))
      .filter((x) => x.s && new Date(x.s.startAt).getTime() > now)
      .sort((a, b) => a.s.startAt.localeCompare(b.s.startAt));
    const upcomingPT = db.ptBookings
      .filter((b) => b.memberId === uid && ['pending', 'confirmed'].includes(b.status) && new Date(b.startAt).getTime() > now)
      .sort((a, b) => a.startAt.localeCompare(b.startAt));
    return { ms, current, latest, balance, upcomingClass, upcomingPT };
  }, [db, user]);
}

export function MemberHome() {
  const { db, user } = useApp();
  const { current, latest, balance, upcomingClass, upcomingPT } = useMemberData();
  const plan = current ? L.planById(db, current.planId) : undefined;
  const st = current ? L.membershipStatus(db, current) : latest ? L.membershipStatus(db, latest) : undefined;
  const daysLeft = current ? diffDays(todayStr(), current.endDate) : 0;
  const total = current ? diffDays(current.startDate, current.endDate) : 1;
  const metrics = db.bodyMetrics.filter((m) => m.memberId === user!.id).sort((a, b) => a.date.localeCompare(b.date));
  const monthCheckins = db.checkins.filter((c) => c.memberId === user!.id && c.result === 'success' && new Date(c.checkInAt).getTime() > Date.now() - 30 * 86400000);
  const minutes = monthCheckins.reduce((s, c) => s + (c.checkOutAt ? (new Date(c.checkOutAt).getTime() - new Date(c.checkInAt).getTime()) / 60000 : 0), 0);
  const attended = db.classBookings.filter((b) => b.memberId === user!.id && b.status === 'attended').length + db.ptBookings.filter((b) => b.memberId === user!.id && b.status === 'completed').length;

  const events = [
    ...upcomingClass.map(({ b, s }) => {
      const c = L.classById(db, s.classId)!;
      return { at: s.startAt, title: c.name, sub: `${s.room} · ${L.branchById(db, c.branchId)?.name}`, badge: cbLabel[b.status], color: c.color };
    }),
    ...upcomingPT.map((b) => ({ at: b.startAt, title: `PT 1-kèm-1 · ${L.userById(db, b.trainerId)?.fullName}`, sub: L.branchById(db, b.branchId)?.name ?? '', badge: ptbLabel[b.status], color: '#00d1b2' })),
  ].sort((a, b) => a.at.localeCompare(b.at));

  return (
    <>
      <div className="card hero-card mb16" style={{ padding: 28 }}>
        <div className="row between wrap" style={{ gap: 20 }}>
          <div>
            <div className="row"><Sparkles size={18} color="#ff8fb0" /><span className="muted">Xin chào,</span></div>
            <h1 style={{ fontSize: 30, marginTop: 4 }}>{user!.fullName} 👋</h1>
            {current && plan ? (
              <div className="row wrap mt8">
                <Badge color="pink">{plan.name}</Badge>
                <Badge color={mStatusLabel[st!][1]}>{mStatusLabel[st!][0]}</Badge>
                <span className="muted small">Hiệu lực đến {fmtDate(current.endDate)} · {L.scopeLabel(db, plan.branchScope)}</span>
              </div>
            ) : (
              <p className="muted mt8">Bạn chưa có gói hội viên còn hiệu lực. Chọn gói để bắt đầu tập luyện!</p>
            )}
          </div>
          <div className="row wrap">
            <Link to="/member/card" className="btn"><QrCode size={17} /> Thẻ check-in</Link>
            <Link to="/member/classes" className="btn primary"><CalendarDays size={17} /> Đặt lớp ngay</Link>
          </div>
        </div>
        {current && (
          <div className="mt24">
            <div className="row between small mb16" style={{ marginBottom: 8 }}>
              <span className="muted">Thời hạn gói</span>
              <span className="bold">Còn {daysLeft} ngày</span>
            </div>
            <Progress value={100 - (daysLeft / total) * 100} />
          </div>
        )}
        {current && daysLeft <= db.settings.expiryWarningDays && (
          <div className="row mt16" style={{ color: '#ffc857' }}>
            <AlertTriangle size={16} /> Gói sắp hết hạn – <Link to="/member/memberships" className="bold" style={{ textDecoration: 'underline' }}>gia hạn ngay</Link>
          </div>
        )}
      </div>

      <div className="grid g4 mb16">
        <StatCard icon={<Dumbbell size={22} />} label="Buổi PT còn lại" value={balance.total} color="#00d1b2" sub={`${balance.free} tặng kèm · ${balance.pkg} gói PT`} />
        <StatCard icon={<Flame size={22} />} label="Lượt đến phòng (30 ngày)" value={monthCheckins.length} color="#ff5c8a" />
        <StatCard icon={<Timer size={22} />} label="Giờ tập (30 ngày)" value={`${Math.round(minutes / 60)}h`} color="#ffb020" />
        <StatCard icon={<Activity size={22} />} label="Buổi đã tham gia" value={attended} color="#7c5cff" />
      </div>

      <div className="grid g2">
        <div className="card">
          <div className="card-head">
            <h2><CalendarDays size={18} /> Lịch sắp tới</h2>
            <Link to="/member/bookings" className="btn ghost sm">Tất cả <ArrowRight size={14} /></Link>
          </div>
          {events.length === 0 ? <Empty text="Chưa có lịch nào sắp tới" /> : (
            <div className="col">
              {events.slice(0, 5).map((e, i) => (
                <div className="list-item" key={i}>
                  <div className="date-box" style={{ borderColor: e.color + '66', background: e.color + '22' }}>
                    <div className="d">{new Date(e.at).getDate()}</div>
                    <div className="m">Th{new Date(e.at).getMonth() + 1}</div>
                  </div>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="bold">{e.title}</div>
                    <div className="small muted">{fmtWeekday(e.at)} · {fmtTime(e.at)} · {e.sub}</div>
                  </div>
                  <Badge color={e.badge[1]}>{e.badge[0]}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card">
          <div className="card-head">
            <h2><Activity size={18} /> Cân nặng</h2>
            <Link to="/member/progress" className="btn ghost sm">Chi tiết <ArrowRight size={14} /></Link>
          </div>
          {metrics.length < 2 ? <Empty text="Cập nhật chỉ số cơ thể để xem biểu đồ tiến độ" /> : (
            <>
              <div className="row" style={{ gap: 24 }}>
                <div><div className="small muted">Hiện tại</div><div style={{ fontSize: 26, fontWeight: 800 }}>{metrics.at(-1)!.weight} kg</div></div>
                <div><div className="small muted">Thay đổi</div><div style={{ fontSize: 26, fontWeight: 800, color: '#5ef0a0' }}>{(metrics.at(-1)!.weight - metrics[0].weight).toFixed(1)} kg</div></div>
              </div>
              <div style={{ height: 180, marginTop: 10 }}>
                <ResponsiveContainer>
                  <AreaChart data={metrics.map((m) => ({ d: fmtDate(m.date).slice(0, 5), w: m.weight }))}>
                    <defs><linearGradient id="gw" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7c5cff" stopOpacity={0.5} /><stop offset="100%" stopColor="#7c5cff" stopOpacity={0} /></linearGradient></defs>
                    <XAxis dataKey="d" axisLine={false} tickLine={false} />
                    <YAxis domain={['dataMin - 1', 'dataMax + 1']} hide />
                    <Tooltip />
                    <Area type="monotone" dataKey="w" name="Cân nặng" stroke="#a78bfa" strokeWidth={3} fill="url(#gw)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      </div>
      {!current && (
        <div className="card mt16 row between wrap">
          <div className="row"><CreditCard size={22} color="#a78bfa" /><div><h3>Chọn gói tập phù hợp</h3><div className="small muted">Gói tháng, quý, năm hoặc VIP kèm buổi PT miễn phí.</div></div></div>
          <Link to="/member/memberships" className="btn primary">Xem các gói <ArrowRight size={16} /></Link>
        </div>
      )}
    </>
  );
}
