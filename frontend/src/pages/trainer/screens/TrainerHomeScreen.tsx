import { Link } from 'react-router-dom';
import { CalendarDays, Inbox, Star, Clock, ClipboardCheck, ArrowRight, UserCheck } from 'lucide-react';
import { useApp } from '../../../store/AppContext';
import * as L from '../../../store/logic';
import { Badge, Empty, StatCard, Stars } from '../../../components/ui';
import { addDays, todayStr, fmtDate, fmtTime, fmtDateTime, fmtWeekday } from '../../../utils';
import { useTrainerStats } from './useTrainerStats';

export function TrainerHomeScreen() {
  const { db, user } = useApp();
  const s = useTrainerStats();
  const today = todayStr();
  const agenda = [
    ...s.upcomingSessions.filter((x) => x.date <= addDays(today, 2)).map((x) => ({ at: x.startAt, title: L.classById(db, x.classId)?.name ?? '', sub: `${x.room} · ${L.bookedCount(db, x.id)}/${L.classById(db, x.classId)?.capacity} học viên`, type: 'Lớp nhóm', color: L.classById(db, x.classId)?.color })),
    ...s.upcomingPT.filter((b) => b.startAt.slice(0, 10) <= addDays(today, 3)).map((b) => ({ at: b.startAt, title: `PT · ${L.userById(db, b.memberId)?.fullName}`, sub: b.note || L.branchById(db, b.branchId)?.name, type: '1-kèm-1', color: '#00d1b2' })),
  ].sort((a, b) => a.at.localeCompare(b.at));

  return (
    <>
      <div className="card hero-card mb16" style={{ padding: 28 }}>
        <div className="row between wrap">
          <div>
            <div className="muted">Chào HLV,</div>
            <h1 style={{ fontSize: 30 }}>{user!.fullName} 💪</h1>
            <div className="row wrap mt8">{user!.trainer?.specialties.map((x) => <Badge key={x} color="purple" plain>{x}</Badge>)}</div>
          </div>
          <div className="row"><Link to="/trainer/availability" className="btn"><Clock size={16} /> Cập nhật lịch rảnh</Link><Link to="/trainer/requests" className="btn primary"><Inbox size={16} /> Yêu cầu ({s.pending.length})</Link></div>
        </div>
      </div>
      <div className="grid g4 mb16">
        <StatCard icon={<Inbox size={22} />} label="Yêu cầu chờ xác nhận" value={s.pending.length} color="#ffb020" />
        <StatCard icon={<CalendarDays size={22} />} label="Buổi lớp sắp tới" value={s.upcomingSessions.length} color="#7c5cff" />
        <StatCard icon={<UserCheck size={22} />} label="Buổi PT đã dạy" value={s.ptDone} color="#00d1b2" />
        <StatCard icon={<Star size={22} />} label={`Đánh giá TB (${s.reviews.length})`} value={s.avg ? s.avg.toFixed(2) : '—'} color="#ff5c8a" />
      </div>
      <div className="grid g2">
        <div className="card">
          <div className="card-head"><h2><CalendarDays size={18} /> Lịch dạy sắp tới</h2></div>
          {agenda.length === 0 ? <Empty text="Không có lịch trong vài ngày tới" /> : (
            <div className="col">{agenda.slice(0, 7).map((a, i) => (
              <div className="list-item" key={i}>
                <div className="date-box" style={{ background: a.color + '22', borderColor: a.color + '66' }}><div className="d">{new Date(a.at).getDate()}</div><div className="m">{fmtTime(a.at)}</div></div>
                <div className="grow"><b>{a.title}</b><div className="small muted">{fmtWeekday(a.at)} · {a.sub}</div></div>
                <Badge color={a.type === 'Lớp nhóm' ? 'purple' : 'blue'} plain>{a.type}</Badge>
              </div>
            ))}</div>
          )}
        </div>
        <div className="card">
          <div className="card-head"><h2><ClipboardCheck size={18} /> Cần điểm danh</h2><Link to="/trainer/classes" className="btn ghost sm">Mở <ArrowRight size={14} /></Link></div>
          {s.toMark.length === 0 ? <Empty text="Đã điểm danh đầy đủ 🎉" /> : (
            <div className="col">{s.toMark.slice(-5).reverse().map((x) => (
              <div className="list-item" key={x.id}><div className="grow"><b>{L.classById(db, x.classId)?.name}</b><div className="small muted">{fmtDateTime(x.startAt)} · {L.bookedCount(db, x.id)} đăng ký</div></div><Badge color="amber">Chưa điểm danh</Badge></div>
            ))}</div>
          )}
          <div className="divider" />
          <h3 className="mb16">Đánh giá gần đây</h3>
          {s.reviews.slice(0, 3).map((r) => (
            <div key={r.id} className="mb16"><div className="row"><Stars value={r.rating} size={13} /><span className="small dim">{L.userById(db, r.memberId)?.fullName} · {fmtDate(r.createdAt)}</span></div><div className="small muted">{r.comment}</div></div>
          ))}
        </div>
      </div>
    </>
  );
}

export default TrainerHomeScreen;
