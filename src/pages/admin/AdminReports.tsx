import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { DollarSign, Users, UserPlus, UserMinus, TrendingUp, CalendarDays, Dumbbell, Star, Building2, Activity, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import * as L from '../../store/logic';
import { Avatar, Badge, PageHead, StatCard, Stars, Tabs, Progress } from '../../components/ui';
import { fmtMoney, fmtMoneyShort, todayStr, toDateStr, fmtDateTime } from '../../utils';
import type { DB } from '../../types';

const PALETTE = ['#7c5cff', '#ff5c8a', '#00d1b2', '#ffb020', '#3fa9ff', '#a259ff', '#2ed47a'];

const monthKey = (iso: string) => iso.slice(0, 7);
const lastMonths = (n: number) => {
  const out: string[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push(`${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`);
  }
  return out;
};
const monthLabel = (k: string) => `T${+k.slice(5)}/${k.slice(2, 4)}`;
const monthStart = (k: string) => `${k}-01`;
const monthEnd = (k: string) => {
  const [y, m] = k.split('-').map(Number);
  return toDateStr(new Date(y, m, 0));
};

/** chi nhánh "chính" của hội viên = chi nhánh của giao dịch gần nhất */
const memberBranch = (db: DB, mid: string) => db.payments.find((p) => p.memberId === mid && p.status === 'success')?.branchId;

function useStats(branch: string, months = 6) {
  const { db } = useApp();
  return useMemo(() => {
    const ms = lastMonths(months);
    const inB = (b?: string) => branch === 'all' || b === branch;
    const pays = db.payments.filter((p) => p.status === 'success' && inB(p.branchId));
    const members = db.users.filter((u) => u.role === 'member' && inB(memberBranch(db, u.id)));
    const paidMs = db.memberships.filter((m) => m.payStatus === 'paid');
    const activeOn = (mid: string, date: string) => paidMs.some((m) => m.memberId === mid && m.startDate <= date && date <= m.endDate);

    const revenue = ms.map((k) => {
      const l = pays.filter((p) => monthKey(new Date(p.createdAt).toLocaleDateString('sv-SE')) === k);
      return {
        k, label: monthLabel(k),
        membership: l.filter((p) => p.kind !== 'pt').reduce((s, p) => s + p.amount, 0),
        pt: l.filter((p) => p.kind === 'pt').reduce((s, p) => s + p.amount, 0),
        ...Object.fromEntries(db.branches.map((b) => [b.id, l.filter((p) => p.branchId === b.id).reduce((s, p) => s + p.amount, 0)])),
      };
    });

    const churn = ms.map((k) => {
      const s = monthStart(k), e = monthEnd(k);
      const end = e > todayStr() ? todayStr() : e;
      const activeStart = members.filter((u) => activeOn(u.id, s));
      const lost = activeStart.filter((u) => !activeOn(u.id, end) && !paidMs.some((m) => m.memberId === u.id && m.startDate > s && m.startDate <= end)).length;
      const newM = members.filter((u) => {
        const first = paidMs.filter((m) => m.memberId === u.id).sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
        return first && first.startDate >= s && first.startDate <= e;
      }).length;
      return { k, label: monthLabel(k), active: activeStart.length, lost, newM, rate: activeStart.length ? +((lost / activeStart.length) * 100).toFixed(1) : 0 };
    });

    const classes = db.classes.filter((c) => inB(c.branchId)).map((c) => {
      const ss = db.sessions.filter((s) => s.classId === c.id && s.status !== 'cancelled' && new Date(s.startAt).getTime() < Date.now());
      const bk = db.classBookings.filter((b) => ss.some((s) => s.id === b.sessionId));
      const booked = bk.filter((b) => ['attended', 'no_show', 'booked'].includes(b.status)).length;
      const att = bk.filter((b) => b.status === 'attended').length;
      const rv = db.reviews.filter((r) => r.classId === c.id);
      return { c, sessions: ss.length, fill: ss.length ? Math.round((booked / (ss.length * c.capacity)) * 100) : 0, attendance: booked ? Math.round((att / booked) * 100) : 0, att, rating: rv.length ? rv.reduce((a, r) => a + r.rating, 0) / rv.length : 0, nReview: rv.length, waitlisted: db.classBookings.filter((b) => db.sessions.some((s) => s.classId === c.id && s.id === b.sessionId) && ['waitlist', 'waitlist_expired'].includes(b.status)).length };
    });

    const trainers = db.users.filter((u) => u.role === 'trainer' && (branch === 'all' || u.trainer?.branchIds.includes(branch))).map((t) => {
      const pt = db.ptBookings.filter((b) => b.trainerId === t.id && inB(b.branchId));
      const done = pt.filter((b) => b.status === 'completed').length;
      const noShow = pt.filter((b) => b.status === 'no_show').length;
      const rejected = pt.filter((b) => b.status === 'rejected').length;
      const classSessions = db.sessions.filter((s) => s.trainerId === t.id && s.status !== 'cancelled' && new Date(s.startAt).getTime() < Date.now() && inB(L.classById(db, s.classId)?.branchId)).length;
      const rv = db.reviews.filter((r) => r.trainerId === t.id);
      return { t, done, noShow, rejected, classSessions, rating: rv.length ? rv.reduce((a, r) => a + r.rating, 0) / rv.length : 0, nReview: rv.length };
    });

    const planUsage = db.membershipPlans.map((p) => ({ name: p.name, value: paidMs.filter((m) => m.planId === p.id && m.endDate >= todayStr() && m.startDate <= todayStr() && inB(memberBranch(db, m.memberId))).length, color: p.color })).filter((x) => x.value > 0);
    const ptPk = db.ptPackages.filter((p) => p.payStatus === 'paid' && inB(memberBranch(db, p.memberId)));
    const ptUsage = {
      sold: ptPk.reduce((s, p) => s + p.sessionsTotal, 0),
      used: ptPk.reduce((s, p) => s + p.sessionsUsed, 0),
      freeTotal: paidMs.filter((m) => inB(memberBranch(db, m.memberId))).reduce((s, m) => s + m.freeSessionsTotal, 0),
      freeUsed: paidMs.filter((m) => inB(memberBranch(db, m.memberId))).reduce((s, m) => s + m.freeSessionsUsed, 0),
    };
    const activeNow = members.filter((u) => activeOn(u.id, todayStr())).length;
    const visits = ms.map((k) => ({ label: monthLabel(k), v: db.checkins.filter((c) => c.result === 'success' && inB(c.branchId) && monthKey(new Date(c.checkInAt).toLocaleDateString('sv-SE')) === k).length }));
    const hours = Array.from({ length: 18 }, (_, i) => i + 5).map((h) => ({ h: `${h}h`, v: db.checkins.filter((c) => c.result === 'success' && inB(c.branchId) && new Date(c.checkInAt).getHours() === h).length }));
    return { revenue, churn, classes, trainers, planUsage, ptUsage, activeNow, members, visits, hours, pays };
  }, [db, branch, months]);
}

function BranchFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { db } = useApp();
  return (
    <select className="input" style={{ width: 210 }} value={value} onChange={(e) => onChange(e.target.value)} id="branch-filter">
      <option value="all">Toàn hệ thống</option>
      {db.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
    </select>
  );
}

const tooltipMoney = (v: unknown) => fmtMoney(Number(v));

/* ================= Dashboard admin ================= */
export function AdminHome() {
  const { db } = useApp();
  const [branch, setBranch] = useState('all');
  const s = useStats(branch);
  const cur = s.revenue.at(-1)!;
  const prev = s.revenue.at(-2)!;
  const curTotal = cur.membership + cur.pt;
  const prevTotal = prev.membership + prev.pt;
  const growth = prevTotal ? ((curTotal - prevTotal) / prevTotal) * 100 : 0;
  const lastChurn = s.churn.at(-2)!;
  const present = db.branches.map((b) => ({ b, n: L.presentCount(db, b.id) }));
  const recent = s.pays.slice(0, 6);
  return (
    <>
      <PageHead title="Dashboard quản trị" desc="Bức tranh tổng thể hoạt động kinh doanh & vận hành." actions={<><BranchFilter value={branch} onChange={setBranch} /><Link to="/admin/reports" className="btn primary"><TrendingUp size={16} /> Báo cáo chi tiết</Link></>} />
      <div className="grid g4 mb16">
        <StatCard icon={<DollarSign size={22} />} label="Doanh thu tháng này" value={fmtMoneyShort(curTotal)} color="#7c5cff" trend={{ v: `${Math.abs(growth).toFixed(0)}%`, up: growth >= 0 }} sub={`Tháng trước: ${fmtMoney(prevTotal)}`} />
        <StatCard icon={<Users size={22} />} label="Hội viên đang hoạt động" value={s.activeNow} color="#00d1b2" sub={`Tổng ${s.members.length} tài khoản hội viên`} />
        <StatCard icon={<UserPlus size={22} />} label="Hội viên mới tháng này" value={s.churn.at(-1)!.newM} color="#2ed47a" />
        <StatCard icon={<UserMinus size={22} />} label={`Churn rate ${lastChurn.label}`} value={`${lastChurn.rate}%`} color="#ff5c8a" sub={`${lastChurn.lost}/${lastChurn.active} hội viên rời đi`} />
      </div>
      <div className="grid g3 mb16">
        <div className="card span2">
          <div className="card-head"><h2><DollarSign size={18} /> Doanh thu 6 tháng</h2><Badge color="purple" plain>Gói hội viên + PT</Badge></div>
          <div style={{ height: 300 }}>
            <ResponsiveContainer>
              <AreaChart data={s.revenue}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7c5cff" stopOpacity={0.6} /><stop offset="100%" stopColor="#7c5cff" stopOpacity={0} /></linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00d1b2" stopOpacity={0.6} /><stop offset="100%" stopColor="#00d1b2" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtMoneyShort} axisLine={false} tickLine={false} width={60} />
                <Tooltip formatter={tooltipMoney} />
                <Legend />
                <Area type="monotone" dataKey="membership" name="Gói hội viên" stackId="1" stroke="#a78bfa" fill="url(#g1)" strokeWidth={2} />
                <Area type="monotone" dataKey="pt" name="Gói PT" stackId="1" stroke="#00d1b2" fill="url(#g2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h2><Activity size={18} /> Đang có mặt</h2><span className="live-dot" /></div>
          <div className="col">
            {present.map(({ b, n }) => (
              <div key={b.id} className="list-item">
                <Building2 size={20} color="#a78bfa" />
                <div className="grow"><b>{b.name}</b><div className="small dim">{b.openTime}–{b.closeTime}</div></div>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{n}</div>
              </div>
            ))}
          </div>
          <div className="divider" />
          <h3 className="mb16">Cơ cấu gói đang hoạt động</h3>
          <div style={{ height: 150 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={s.planUsage} dataKey="value" nameKey="name" innerRadius={42} outerRadius={68} paddingAngle={3}>
                  {s.planUsage.map((p) => <Cell key={p.name} fill={p.color} stroke="none" />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="chips" style={{ justifyContent: 'center' }}>{s.planUsage.map((p) => <span key={p.name} className="small row" style={{ gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: p.color }} />{p.name} ({p.value})</span>)}</div>
        </div>
      </div>
      <div className="grid g2">
        <div className="card">
          <div className="card-head"><h2><CalendarDays size={18} /> Top lớp học (tỷ lệ lấp đầy)</h2></div>
          <div className="col">
            {[...s.classes].sort((a, b) => b.fill - a.fill).slice(0, 5).map((x) => (
              <div key={x.c.id}>
                <div className="row between small"><span><b>{x.c.name}</b> <span className="dim">· {L.branchById(db, x.c.branchId)?.name.replace('DFGym ', '')}</span></span><span className="bold">{x.fill}%</span></div>
                <div className="mt8" style={{ marginTop: 4 }}><Progress value={x.fill} color={x.c.color} /></div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h2><DollarSign size={18} /> Giao dịch gần đây</h2></div>
          <div className="col">
            {recent.map((p) => { const m = L.userById(db, p.memberId); return (
              <div className="list-item" key={p.id}><Avatar user={m} size="sm" /><div className="grow" style={{ minWidth: 0 }}><b>{m?.fullName}</b><div className="small dim">{p.description} · {fmtDateTime(p.createdAt)}</div></div><b style={{ color: '#5ef0a0' }}>+{fmtMoneyShort(p.amount)}</b></div>
            ); })}
          </div>
        </div>
      </div>
    </>
  );
}

/* ================= Báo cáo ================= */
export function AdminReports() {
  const { db } = useApp();
  const [branch, setBranch] = useState('all');
  const [months, setMonths] = useState(6);
  const [tab, setTab] = useState<'revenue' | 'members' | 'classes' | 'trainers' | 'usage'>('revenue');
  const s = useStats(branch, months);
  const totalRev = s.revenue.reduce((a, r) => a + r.membership + r.pt, 0);
  const exportCsv = () => {
    const rows = [['Tháng', 'Gói hội viên', 'Gói PT', 'Tổng', 'HV đầu kỳ', 'HV mới', 'HV rời đi', 'Churn %']].concat(
      s.revenue.map((r, i) => [r.label, String(r.membership), String(r.pt), String(r.membership + r.pt), String(s.churn[i].active), String(s.churn[i].newM), String(s.churn[i].lost), String(s.churn[i].rate)]),
    );
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\ufeff' + rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' }));
    a.download = `bao-cao-${branch}.csv`;
    a.click();
  };
  return (
    <>
      <PageHead title="Báo cáo & thống kê" desc="Doanh thu, biến động hội viên, hiệu suất lớp học và huấn luyện viên theo chi nhánh." actions={<>
        <BranchFilter value={branch} onChange={setBranch} />
        <select className="input" style={{ width: 140 }} value={months} onChange={(e) => setMonths(+e.target.value)}><option value={3}>3 tháng</option><option value={6}>6 tháng</option><option value={12}>12 tháng</option></select>
        <button className="btn" onClick={exportCsv}><Download size={16} /> Xuất CSV</button>
      </>} />
      <Tabs value={tab} onChange={setTab} tabs={[
        { id: 'revenue', label: <><DollarSign size={15} /> Doanh thu</> },
        { id: 'members', label: <><Users size={15} /> Hội viên & churn</> },
        { id: 'usage', label: <><Activity size={15} /> Sử dụng gói & mật độ</> },
        { id: 'classes', label: <><CalendarDays size={15} /> Lớp học</> },
        { id: 'trainers', label: <><Dumbbell size={15} /> Huấn luyện viên</> },
      ]} />

      {tab === 'revenue' && (
        <>
          <div className="grid g3 mb16">
            <StatCard icon={<DollarSign size={22} />} label={`Tổng doanh thu ${months} tháng`} value={fmtMoneyShort(totalRev)} color="#7c5cff" />
            <StatCard icon={<Users size={22} />} label="Từ gói hội viên" value={fmtMoneyShort(s.revenue.reduce((a, r) => a + r.membership, 0))} color="#ff5c8a" />
            <StatCard icon={<Dumbbell size={22} />} label="Từ gói PT" value={fmtMoneyShort(s.revenue.reduce((a, r) => a + r.pt, 0))} color="#00d1b2" />
          </div>
          <div className="grid g2">
            <div className="card">
              <div className="card-head"><h2>Doanh thu theo loại gói</h2></div>
              <div style={{ height: 300 }}><ResponsiveContainer><BarChart data={s.revenue}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" axisLine={false} tickLine={false} /><YAxis tickFormatter={fmtMoneyShort} axisLine={false} tickLine={false} width={55} /><Tooltip formatter={tooltipMoney} cursor={{ fill: 'rgba(255,255,255,.04)' }} /><Legend /><Bar dataKey="membership" name="Gói hội viên" stackId="a" fill="#7c5cff" /><Bar dataKey="pt" name="Gói PT" stackId="a" fill="#00d1b2" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
            </div>
            <div className="card">
              <div className="card-head"><h2>Doanh thu theo chi nhánh</h2></div>
              <div style={{ height: 300 }}><ResponsiveContainer><LineChart data={s.revenue}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" axisLine={false} tickLine={false} /><YAxis tickFormatter={fmtMoneyShort} axisLine={false} tickLine={false} width={55} /><Tooltip formatter={tooltipMoney} /><Legend />{db.branches.map((b, i) => <Line key={b.id} type="monotone" dataKey={b.id} name={b.name} stroke={PALETTE[i]} strokeWidth={3} dot={{ r: 4 }} />)}</LineChart></ResponsiveContainer></div>
            </div>
          </div>
          <div className="table-wrap mt16">
            <table>
              <thead><tr><th>Kỳ</th><th>Gói hội viên</th><th>Gói PT</th>{db.branches.map((b) => <th key={b.id}>{b.name.replace('DFGym ', '')}</th>)}<th>Tổng</th></tr></thead>
              <tbody>{s.revenue.map((r) => { const rr = r as unknown as Record<string, number>; return <tr key={r.k}><td><b>{r.label}</b></td><td>{fmtMoney(r.membership)}</td><td>{fmtMoney(r.pt)}</td>{db.branches.map((b) => <td key={b.id}>{fmtMoney(rr[b.id] ?? 0)}</td>)}<td className="bold">{fmtMoney(r.membership + r.pt)}</td></tr>; })}</tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'members' && (
        <>
          <div className="grid g2">
            <div className="card">
              <div className="card-head"><h2>Hội viên mới vs rời đi</h2></div>
              <div style={{ height: 300 }}><ResponsiveContainer><BarChart data={s.churn}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" axisLine={false} tickLine={false} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} width={30} /><Tooltip cursor={{ fill: 'rgba(255,255,255,.04)' }} /><Legend /><Bar dataKey="newM" name="Mới" fill="#2ed47a" radius={[6, 6, 0, 0]} /><Bar dataKey="lost" name="Rời đi" fill="#ff5c8a" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
            </div>
            <div className="card">
              <div className="card-head"><h2>Churn rate (%) & hội viên đầu kỳ</h2></div>
              <div style={{ height: 300 }}><ResponsiveContainer><LineChart data={s.churn}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" axisLine={false} tickLine={false} /><YAxis yAxisId="l" axisLine={false} tickLine={false} width={30} /><YAxis yAxisId="r" orientation="right" axisLine={false} tickLine={false} width={30} /><Tooltip /><Legend /><Line yAxisId="l" type="monotone" dataKey="rate" name="Churn %" stroke="#ff5c8a" strokeWidth={3} /><Line yAxisId="r" type="monotone" dataKey="active" name="HV đầu kỳ" stroke="#3fa9ff" strokeWidth={3} /></LineChart></ResponsiveContainer></div>
            </div>
          </div>
          <div className="table-wrap mt16">
            <table><thead><tr><th>Kỳ</th><th>HV hoạt động đầu kỳ</th><th>HV mới</th><th>HV rời đi</th><th>Tăng/giảm ròng</th><th>Churn rate</th></tr></thead>
              <tbody>{s.churn.map((c) => <tr key={c.k}><td><b>{c.label}</b></td><td>{c.active}</td><td style={{ color: '#5ef0a0' }}>+{c.newM}</td><td style={{ color: '#ff8aa0' }}>-{c.lost}</td><td className="bold">{c.newM - c.lost >= 0 ? '+' : ''}{c.newM - c.lost}</td><td><Badge color={c.rate > 15 ? 'red' : c.rate > 8 ? 'amber' : 'green'}>{c.rate}%</Badge></td></tr>)}</tbody>
            </table>
          </div>
          <div className="small dim mt8">* Churn rate = số hội viên đang hoạt động đầu kỳ nhưng không còn gói hiệu lực cuối kỳ (không gia hạn) / số hội viên đầu kỳ.</div>
        </>
      )}

      {tab === 'usage' && (
        <>
          <div className="grid g4 mb16">
            <StatCard icon={<Dumbbell size={22} />} label="Buổi PT (gói PT) đã dùng" value={`${s.ptUsage.used}/${s.ptUsage.sold}`} color="#00d1b2" sub={`${s.ptUsage.sold ? Math.round((s.ptUsage.used / s.ptUsage.sold) * 100) : 0}% đã sử dụng`} />
            <StatCard icon={<Star size={22} />} label="Buổi PT tặng kèm đã dùng" value={`${s.ptUsage.freeUsed}/${s.ptUsage.freeTotal}`} color="#ff5c8a" />
            <StatCard icon={<Users size={22} />} label="Gói đang hoạt động" value={s.planUsage.reduce((a, p) => a + p.value, 0)} color="#7c5cff" />
            <StatCard icon={<Activity size={22} />} label="Lượt check-in tháng này" value={s.visits.at(-1)!.v} color="#ffb020" />
          </div>
          <div className="grid g2">
            <div className="card">
              <div className="card-head"><h2>Mật độ check-in theo giờ</h2></div>
              <div style={{ height: 280 }}><ResponsiveContainer><BarChart data={s.hours}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="h" axisLine={false} tickLine={false} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} width={30} /><Tooltip cursor={{ fill: 'rgba(255,255,255,.04)' }} /><Bar dataKey="v" name="Lượt check-in" fill="#ffb020" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
            </div>
            <div className="card">
              <div className="card-head"><h2>Phân bố gói hội viên đang hoạt động</h2></div>
              <div style={{ height: 280 }}><ResponsiveContainer><PieChart><Pie data={s.planUsage} dataKey="value" nameKey="name" outerRadius={100} innerRadius={55} paddingAngle={3} label={(e: { name?: string; value?: number }) => `${e.name}: ${e.value}`}>{s.planUsage.map((p) => <Cell key={p.name} fill={p.color} stroke="none" />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
            </div>
          </div>
        </>
      )}

      {tab === 'classes' && (
        <>
          <div className="card mb16">
            <div className="card-head"><h2>Tỷ lệ lấp đầy & tham gia</h2></div>
            <div style={{ height: 300 }}><ResponsiveContainer><BarChart data={s.classes.map((x) => ({ name: x.c.name, fill: x.fill, attendance: x.attendance }))}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" axisLine={false} tickLine={false} /><YAxis unit="%" axisLine={false} tickLine={false} width={40} /><Tooltip cursor={{ fill: 'rgba(255,255,255,.04)' }} /><Legend /><Bar dataKey="fill" name="Lấp đầy %" fill="#7c5cff" radius={[6, 6, 0, 0]} /><Bar dataKey="attendance" name="Tham gia %" fill="#00d1b2" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
          </div>
          <div className="table-wrap">
            <table><thead><tr><th>Lớp</th><th>Chi nhánh</th><th>HLV</th><th>Buổi đã dạy</th><th>Lấp đầy</th><th>Tham gia</th><th>Lượt chờ</th><th>Đánh giá</th></tr></thead>
              <tbody>{s.classes.map((x) => <tr key={x.c.id}><td><div className="row"><span style={{ width: 10, height: 10, borderRadius: 3, background: x.c.color }} /><b>{x.c.name}</b></div></td><td className="small">{L.branchById(db, x.c.branchId)?.name}</td><td className="small">{L.userById(db, x.c.trainerId)?.fullName}</td><td>{x.sessions}</td><td style={{ minWidth: 120 }}><div className="row small"><div className="grow"><Progress value={x.fill} color={x.c.color} /></div>{x.fill}%</div></td><td>{x.attendance}%</td><td>{x.waitlisted}</td><td><div className="row small"><Stars value={x.rating} size={12} />{x.rating ? x.rating.toFixed(1) : '—'} ({x.nReview})</div></td></tr>)}</tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'trainers' && (
        <>
          <div className="card mb16">
            <div className="card-head"><h2>Số buổi dạy theo HLV</h2></div>
            <div style={{ height: 280 }}><ResponsiveContainer><BarChart data={s.trainers.map((x) => ({ name: x.t.fullName.split(' ').slice(-2).join(' '), pt: x.done, cls: x.classSessions }))}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" axisLine={false} tickLine={false} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} width={30} /><Tooltip cursor={{ fill: 'rgba(255,255,255,.04)' }} /><Legend /><Bar dataKey="pt" name="Buổi PT hoàn thành" fill="#00d1b2" radius={[6, 6, 0, 0]} /><Bar dataKey="cls" name="Buổi lớp nhóm" fill="#a259ff" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
          </div>
          <div className="table-wrap">
            <table><thead><tr><th>Huấn luyện viên</th><th>Chi nhánh</th><th>PT hoàn thành</th><th>PT vắng</th><th>Từ chối</th><th>Buổi lớp nhóm</th><th>Đánh giá</th></tr></thead>
              <tbody>{[...s.trainers].sort((a, b) => b.rating - a.rating).map((x) => <tr key={x.t.id}><td><div className="row"><Avatar user={x.t} size="sm" /><div><b>{x.t.fullName}</b><div className="small dim">{x.t.trainer?.specialties.join(', ')}</div></div></div></td><td className="small">{x.t.trainer?.branchIds.map((b) => L.branchById(db, b)?.name.replace('DFGym ', '')).join(', ')}</td><td>{x.done}</td><td>{x.noShow}</td><td>{x.rejected}</td><td>{x.classSessions}</td><td><div className="row small"><Stars value={x.rating} size={12} /><b>{x.rating ? x.rating.toFixed(2) : '—'}</b> ({x.nReview})</div></td></tr>)}</tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
