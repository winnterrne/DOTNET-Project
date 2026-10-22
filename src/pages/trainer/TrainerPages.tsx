import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Inbox, Star, Users, Check, X, Plus, Trash2, Clock, ClipboardCheck, Save, Award, ArrowRight, ArrowLeft, UserCheck, MapPin, Info, CheckCircle2, AlertTriangle, ShieldCheck, Settings } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import * as L from '../../store/logic';
import { Avatar, Badge, Empty, Modal, PageHead, StatCard, Stars, Tabs, ReasonModal } from '../../components/ui';
import { ptbLabel, cbLabel } from '../../components/labels';
import { addDays, todayStr, fmtDate, fmtTime, fmtDateTime, fmtWeekday } from '../../utils';
import { GYM_TIME_SLOTS, matchSlotId, getMondayStr, fullDayName, shortDayMonth } from '../member/MemberBooking';

const useTrainerStats = () => {
  const { db, user } = useApp();
  const tid = user!.id;
  const reviews = db.reviews.filter((r) => r.trainerId === tid);
  const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;
  const now = Date.now();
  const pending = db.ptBookings.filter((b) => b.trainerId === tid && b.status === 'pending');
  const upcomingPT = db.ptBookings.filter((b) => b.trainerId === tid && b.status === 'confirmed' && new Date(b.endAt).getTime() > now - 3 * 3600000).sort((a, b) => a.startAt.localeCompare(b.startAt));
  const sessions = db.sessions.filter((s) => s.trainerId === tid).sort((a, b) => a.startAt.localeCompare(b.startAt));
  const upcomingSessions = sessions.filter((s) => s.status === 'scheduled' && new Date(s.startAt).getTime() > now);
  const toMark = sessions.filter((s) => s.status !== 'cancelled' && !s.attendanceConfirmed && new Date(s.startAt).getTime() < now);
  const ptDone = db.ptBookings.filter((b) => b.trainerId === tid && b.status === 'completed').length;
  return { reviews, avg, pending, upcomingPT, sessions, upcomingSessions, toMark, ptDone };
};

/* ================= Dashboard ================= */
export function TrainerHome() {
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

/* ================= Lịch hẹn 1-kèm-1 ================= */
export function TrainerRequests() {
  const { db, user, act } = useApp();
  const [tab, setTab] = useState<'pending' | 'confirmed' | 'history'>('pending');
  const [reject, setReject] = useState<string | null>(null);
  const [cancel, setCancel] = useState<string | null>(null);
  const now = Date.now();
  const all = db.ptBookings.filter((b) => b.trainerId === user!.id);
  const lists = {
    pending: all.filter((b) => b.status === 'pending').sort((a, b) => a.startAt.localeCompare(b.startAt)),
    confirmed: all.filter((b) => b.status === 'confirmed').sort((a, b) => a.startAt.localeCompare(b.startAt)),
    history: all.filter((b) => !['pending', 'confirmed'].includes(b.status)).sort((a, b) => b.startAt.localeCompare(a.startAt)),
  };
  return (
    <>
      <PageHead title="Lịch hẹn 1-kèm-1" desc="Xác nhận/từ chối yêu cầu, xác nhận buổi tập đã diễn ra (yêu cầu hội viên check-in hợp lệ)." />
      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'pending', label: 'Chờ xác nhận', count: lists.pending.length }, { id: 'confirmed', label: 'Đã xác nhận', count: lists.confirmed.length }, { id: 'history', label: 'Lịch sử' }]} />
      {lists[tab].length === 0 ? <div className="card"><Empty text="Không có lịch hẹn" /></div> : (
        <div className="col">
          {lists[tab].map((b) => {
            const m = L.userById(db, b.memberId);
            const started = new Date(b.startAt).getTime() < now;
            const checked = b.checkedIn || L.hasCheckinOn(db, b.memberId, b.branchId, b.startAt.slice(0, 10) && new Date(b.startAt).toLocaleDateString('sv-SE'));
            return (
              <div className="list-item" key={b.id}>
                <Avatar user={m} />
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="row wrap"><b>{m?.fullName}</b><span className="small dim">{m?.phone}</span></div>
                  <div className="small muted">{fmtWeekday(b.startAt)} · {fmtDateTime(b.startAt)} – {fmtTime(b.endAt)} · {L.branchById(db, b.branchId)?.name}</div>
                  {b.note && <div className="small" style={{ color: '#b8a6ff' }}>“{b.note}”</div>}
                </div>
                <Badge color={b.source.type === 'membership_free' ? 'pink' : 'blue'} plain>{b.source.type === 'membership_free' ? 'Buổi tặng' : 'Gói PT'}</Badge>
                {tab === 'pending' && (
                  <>
                    <button className="btn sm danger" onClick={() => setReject(b.id)} id={`reject-${b.id}`}><X size={14} /> Từ chối</button>
                    <button className="btn sm success" onClick={() => act((d) => L.respondPT(d, b.id, true), 'Đã xác nhận lịch hẹn')} id={`accept-${b.id}`}><Check size={14} /> Xác nhận</button>
                  </>
                )}
                {tab === 'confirmed' && (started ? (
                  <>
                    <Badge color={checked ? 'green' : 'gray'}>{checked ? 'Đã check-in' : 'Chưa check-in'}</Badge>
                    <button className="btn sm" onClick={() => act((d) => L.completePT(d, b.id, false), 'Đã ghi nhận vắng mặt')}>Vắng mặt</button>
                    <button className="btn sm success" onClick={() => act((d) => L.completePT(d, b.id, true), 'Đã xác nhận hoàn thành buổi tập')} id={`complete-${b.id}`}><Check size={14} /> Hoàn thành</button>
                  </>
                ) : (
                  <button className="btn sm danger" onClick={() => setCancel(b.id)}><X size={14} /> Hủy lịch</button>
                ))}
                {tab === 'history' && <Badge color={ptbLabel[b.status][1]}>{ptbLabel[b.status][0]}</Badge>}
              </div>
            );
          })}
        </div>
      )}
      {reject && <ReasonModal title="Từ chối lịch hẹn" label="Lý do (gửi đến hội viên)" confirmText="Từ chối" danger onClose={() => setReject(null)} onConfirm={(r) => { act((d) => L.respondPT(d, reject, false, r), 'Đã từ chối và hoàn buổi cho hội viên'); setReject(null); }} />}
      {cancel && <ReasonModal title="Hủy lịch hẹn đã xác nhận" label="Lý do" confirmText="Hủy lịch" danger required onClose={() => setCancel(null)} onConfirm={(r) => { act((d) => L.cancelPTByTrainer(d, cancel, r), 'Đã hủy lịch và hoàn buổi cho hội viên'); setCancel(null); }} />}
    </>
  );
}

/* ================= Lịch rảnh ================= */
const QUICK_TIME_PRESETS = [
  { label: '07:00 (Sáng)', time: '07:00' },
  { label: '08:30 (Sáng)', time: '08:30' },
  { label: '10:00 (Sáng)', time: '10:00' },
  { label: '14:00 (Chiều)', time: '14:00' },
  { label: '15:30 (Chiều)', time: '15:30' },
  { label: '17:30 (Tối)', time: '17:30' },
  { label: '19:00 (Tối)', time: '19:00' },
];

export function TrainerAvailability() {
  const { db, user, act } = useApp();
  const branches = db.branches.filter((b) => user!.trainer?.branchIds.includes(b.id));
  const [date, setDate] = useState(addDays(todayStr(), 1));
  const [time, setTime] = useState('08:30');
  const [dur, setDur] = useState(60);
  const [branch, setBranch] = useState(branches[0]?.id ?? db.branches[0].id);
  const [repeat, setRepeat] = useState(1);
  const [weekIdx, setWeekIdx] = useState(0);
  const [showRuleModal, setShowRuleModal] = useState(false);

  const monday = getMondayStr(todayStr(), weekIdx);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const now = Date.now();
  const slots = db.trainerSlots.filter((s) => s.trainerId === user!.id);
  const sessions = db.sessions.filter(
    (s) => s.trainerId === user!.id && s.status !== 'cancelled',
  );

  const selectedBranch = db.branches.find((b) => b.id === branch);
  const slotsInSelectedDate = slots.filter(
    (s) => new Date(s.startAt).toLocaleDateString('sv-SE') === date,
  ).length;

  // Kiểm tra 5 quy tắc mở khung giờ theo thời gian thực
  const liveRuleChecks = useMemo(() => {
    const startDt = new Date(`${date}T${time}:00`);
    const endDt = new Date(startDt.getTime() + dur * 60000);
    const startIso = startDt.toISOString();
    const endIso = endDt.toISOString();

    const startTimeStr = startDt.toTimeString().slice(0, 5);
    const endTimeStr = endDt.toTimeString().slice(0, 5);
    const sameDay = startDt.toLocaleDateString('sv-SE') === endDt.toLocaleDateString('sv-SE');

    const openT = selectedBranch?.openTime || '06:00';
    const closeT = selectedBranch?.closeTime || '22:00';

    const withinBranchHours = sameDay && startTimeStr >= openT && endTimeStr <= closeT;
    const advanceHours = (startDt.getTime() - Date.now()) / 3600000;
    const minAdvanceOk = advanceHours >= db.settings.cancelDeadlineHours;
    const quotaOk = slotsInSelectedDate < 8;
    const durationOk = [45, 60, 90].includes(dur);

    const hasSlotConflict = db.trainerSlots.some(
      (s) => s.trainerId === user!.id && new Date(s.startAt) < new Date(endIso) && new Date(startIso) < new Date(s.endAt),
    );
    const hasClassConflict = db.sessions.some(
      (s) =>
        s.trainerId === user!.id &&
        s.status === 'scheduled' &&
        new Date(s.startAt) < new Date(endIso) &&
        new Date(startIso) < new Date(s.endAt),
    );
    const noOverlapOk = !hasSlotConflict && !hasClassConflict;

    return {
      endTimeStr,
      withinBranchHours,
      minAdvanceOk,
      quotaOk,
      durationOk,
      noOverlapOk,
      hasSlotConflict,
      hasClassConflict,
      allValid: withinBranchHours && minAdvanceOk && quotaOk && durationOk && noOverlapOk,
    };
  }, [date, time, dur, selectedBranch, db.settings.cancelDeadlineHours, slotsInSelectedDate, db.trainerSlots, db.sessions, user]);

  const add = () => {
    let ok = 0;
    act(
      (d) => {
        for (let i = 0; i < repeat; i++) {
          try {
            L.addSlot(d, user!.id, branch, addDays(date, i * 7), time, dur);
            ok++;
          } catch (e) {
            if (repeat === 1) throw e;
          }
        }
        if (!ok) throw new Error('Không thêm được khung giờ nào (trùng lịch hoặc vi phạm quy tắc ca)');
      },
      () => `Đã thêm ${ok} khung giờ rảnh (${time} – ${liveRuleChecks.endTimeStr}) thành công`,
    );
  };

  return (
    <>
      <PageHead
        title="Quản Lý Lịch Rảnh & Khung Giờ PT"
        desc="Thiết lập khung giờ huấn luyện 1-kèm-1 theo bộ quy tắc vận hành chuẩn của DFGymCenter."
        actions={
          <button className="btn sm" onClick={() => setShowRuleModal(true)}>
            <Info size={15} /> Xem chi tiết 5 quy tắc mở ca
          </button>
        }
      />

      {/* Bảng tạo khung giờ & Kiểm tra quy tắc trực tiếp (Live Validation) */}
      <div className="grid" style={{ gridTemplateColumns: '1.35fr 1fr', gap: 16, marginBottom: 18 }}>
        <div className="card">
          <div className="row between wrap mb12">
            <h3>1. Tạo Khung Giờ Rảnh Mới</h3>
            <span className="small muted">
              Khung giờ kết thúc dự kiến: <b className="mono">{liveRuleChecks.endTimeStr}</b>
            </span>
          </div>

          {/* Gợi ý chọn nhanh khung giờ chuẩn */}
          <div className="mb12">
            <div className="small muted mb6">Chọn nhanh giờ bắt đầu phổ biến:</div>
            <div className="chips">
              {QUICK_TIME_PRESETS.map((p) => (
                <button
                  key={p.time}
                  type="button"
                  className={`chip ${time === p.time ? 'on' : ''}`}
                  onClick={() => setTime(p.time)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
            <div className="field">
              <label>Ngày mở ca</label>
              <input
                type="date"
                className="input"
                min={todayStr()}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                id="slot-date"
              />
            </div>
            <div className="field">
              <label>Giờ bắt đầu</label>
              <input
                type="time"
                className="input"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                id="slot-time"
              />
            </div>
            <div className="field">
              <label>Thời lượng ca</label>
              <select className="input" value={dur} onChange={(e) => setDur(+e.target.value)}>
                <option value={45}>45 phút (HIIT / Express)</option>
                <option value={60}>60 phút (Tiêu chuẩn)</option>
                <option value={90}>90 phút (Chuyên sâu)</option>
              </select>
            </div>
            <div className="field">
              <label>Chi nhánh làm việc</label>
              <select className="input" value={branch} onChange={(e) => setBranch(e.target.value)}>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Lặp lại hàng tuần</label>
              <select className="input" value={repeat} onChange={(e) => setRepeat(+e.target.value)}>
                <option value={1}>Chỉ tuần này (1 buổi)</option>
                <option value={2}>Lặp lại 2 tuần</option>
                <option value={4}>Lặp lại 4 tuần</option>
              </select>
            </div>
          </div>

          <div className="row between wrap mt16" style={{ paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <div className="small muted">
              Đang chọn: <b>{fmtWeekday(date)}, {fmtDate(date)}</b> · <b className="mono">{time} – {liveRuleChecks.endTimeStr}</b> ({dur}p)
            </div>
            <button
              className="btn primary"
              onClick={add}
              id="slot-add"
              disabled={!liveRuleChecks.allValid}
              title={!liveRuleChecks.allValid ? 'Vui lòng điều chỉnh khung giờ thỏa mãn các quy tắc bên phải' : undefined}
            >
              <Plus size={16} /> Thêm khung giờ rảnh
            </button>
          </div>
        </div>

        {/* Bảng Kiểm Tra Quy Tắc Mở Ca Thời Gian Thực */}
        <div className="card" style={{ background: 'var(--surface-2)' }}>
          <div className="row between mb12">
            <div className="row" style={{ gap: 8 }}>
              <ShieldCheck size={18} color="var(--primary)" />
              <h3>2. Kiểm Tra Quy Tắc Mở Ca (Trực Tiếp)</h3>
            </div>
            <Badge color={liveRuleChecks.allValid ? 'green' : 'amber'}>
              {liveRuleChecks.allValid ? 'Hợp lệ để mở' : 'Cần điều chỉnh'}
            </Badge>
          </div>

          <div className="col" style={{ gap: 8, fontSize: 13 }}>
            <div className="row between" style={{ padding: '7px 10px', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <span className="row" style={{ gap: 8 }}>
                {liveRuleChecks.withinBranchHours ? <CheckCircle2 size={15} color="var(--green)" /> : <AlertTriangle size={15} color="var(--red)" />}
                <span>Giờ mở cửa {selectedBranch?.name.replace('DFGym ', '')} ({selectedBranch?.openTime}–{selectedBranch?.closeTime})</span>
              </span>
              <b style={{ color: liveRuleChecks.withinBranchHours ? 'var(--green)' : 'var(--red)' }}>
                {liveRuleChecks.withinBranchHours ? 'Đạt' : 'Ngoài giờ'}
              </b>
            </div>

            <div className="row between" style={{ padding: '7px 10px', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <span className="row" style={{ gap: 8 }}>
                {liveRuleChecks.minAdvanceOk ? <CheckCircle2 size={15} color="var(--green)" /> : <AlertTriangle size={15} color="var(--red)" />}
                <span>Mở trước thời điểm bắt đầu ≥ {db.settings.cancelDeadlineHours} giờ</span>
              </span>
              <b style={{ color: liveRuleChecks.minAdvanceOk ? 'var(--green)' : 'var(--red)' }}>
                {liveRuleChecks.minAdvanceOk ? 'Đạt' : 'Quá sát giờ'}
              </b>
            </div>

            <div className="row between" style={{ padding: '7px 10px', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <span className="row" style={{ gap: 8 }}>
                {liveRuleChecks.quotaOk ? <CheckCircle2 size={15} color="var(--green)" /> : <AlertTriangle size={15} color="var(--red)" />}
                <span>Hạn mức ngày {fmtDate(date).slice(0, 5)} (Tối đa 8 ca/ngày)</span>
              </span>
              <b style={{ color: liveRuleChecks.quotaOk ? 'var(--green)' : 'var(--red)' }}>
                {slotsInSelectedDate}/8 ca
              </b>
            </div>

            <div className="row between" style={{ padding: '7px 10px', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <span className="row" style={{ gap: 8 }}>
                {liveRuleChecks.noOverlapOk ? <CheckCircle2 size={15} color="var(--green)" /> : <AlertTriangle size={15} color="var(--red)" />}
                <span>Không trùng ca PT khác hoặc Lớp học nhóm</span>
              </span>
              <b style={{ color: liveRuleChecks.noOverlapOk ? 'var(--green)' : 'var(--red)' }}>
                {liveRuleChecks.noOverlapOk
                  ? 'Không trùng'
                  : liveRuleChecks.hasClassConflict
                    ? 'Trùng lớp nhóm'
                    : 'Trùng ca PT'}
              </b>
            </div>
          </div>
        </div>
      </div>

      {showRuleModal && (
        <Modal title="Quy tắc mở khung giờ PT dành cho Huấn Luyện Viên" onClose={() => setShowRuleModal(false)}>
          <div className="col" style={{ gap: 12, fontSize: 13.5, lineHeight: 1.6 }}>
            <div className="card" style={{ padding: 14, borderLeft: '4px solid var(--primary)' }}>
              <b>1. Thời gian hoạt động chi nhánh</b>
              <div className="muted mt8">
                Khung giờ mở lịch phải nằm hoàn toàn trong thời gian mở cửa của chi nhánh ({selectedBranch?.openTime} –{' '}
                {selectedBranch?.closeTime}). Không được đặt ca sớm hơn hoặc kết thúc muộn hơn giờ đóng cửa.
              </div>
            </div>
            <div className="card" style={{ padding: 14, borderLeft: '4px solid var(--accent)' }}>
              <b>2. Đặt trước tối thiểu 2 tiếng</b>
              <div className="muted mt8">
                HLV cần mở lịch trước giờ bắt đầu tối thiểu 2 giờ để hội viên kịp nhận diện khung giờ rảnh và đăng ký.
              </div>
            </div>
            <div className="card" style={{ padding: 14, borderLeft: '4px solid var(--amber)' }}>
              <b>3. Giới hạn tối đa 8 ca/ngày</b>
              <div className="muted mt8">
                Mỗi HLV không được mở quá 8 ca dạy trong cùng một ngày nhằm đảm bảo năng lượng và sự tập trung cao nhất cho từng hội viên.
              </div>
            </div>
            <div className="card" style={{ padding: 14, borderLeft: '4px solid var(--blue)' }}>
              <b>4. Thời lượng ca dạy chuẩn (45p / 60p / 90p)</b>
              <div className="muted mt8">
                Chỉ chấp nhận 3 mốc thời lượng: 45 phút, 60 phút hoặc 90 phút theo giáo án chuẩn của hệ thống DFGymCenter.
              </div>
            </div>
            <div className="card" style={{ padding: 14, borderLeft: '4px solid var(--red)' }}>
              <b>5. Chống trùng ca & Lớp nhóm</b>
              <div className="muted mt8">
                Hệ thống tự động quét và chặn mở lịch nếu trùng với ca PT rảnh khác hoặc trùng lịch dạy lớp nhóm (Group Fitness) đã được xếp lịch trước đó.
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* BẢNG THỜI KHÓA BIỂU DẠNG TUẦN CỦA HUẤN LUYỆN VIÊN */}
      <div className="tkb-wrapper">
        <div className="tkb-header-bar">
          <div className="tkb-header-title">
            <Settings size={16} color="var(--primary)" />
            <span>THỜI KHÓA BIỂU DẠNG TUẦN – HLV {user!.fullName.toUpperCase()} ({fmtDate(days[0])} – {fmtDate(days[6])})</span>
          </div>
          <div className="tkb-legend">
            <span className="tkb-legend-item">
              <span className="tkb-swatch" style={{ background: '#38bdf8' }} /> Lớp học nhóm phụ trách
            </span>
            <span className="tkb-legend-item">
              <span className="tkb-swatch" style={{ background: '#10b981' }} /> Ca PT trống (Có thể xóa)
            </span>
            <span className="tkb-legend-item">
              <span className="tkb-swatch" style={{ background: '#a855f7' }} /> Ca PT đã có học viên đặt
            </span>
          </div>
        </div>

        <div className="tkb-table-scroll">
          <table className="tkb-table">
            <thead>
              <tr>
                <th className="tkb-nav-col">
                  <button
                    type="button"
                    className="tkb-nav-btn"
                    onClick={() => setWeekIdx((w) => Math.max(-1, w - 1))}
                    disabled={weekIdx <= -1}
                    title="Tuần trước"
                  >
                    <ArrowLeft size={15} />
                  </button>
                </th>
                {days.map((d) => {
                  const isToday = d === todayStr();
                  const ptCount = slots.filter((s) => new Date(s.startAt).toLocaleDateString('sv-SE') === d).length;
                  return (
                    <th
                      key={d}
                      className={isToday ? 'is-today' : ''}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setDate(d)}
                    >
                      <div>
                        <span>{fullDayName(d)}</span>
                        <span className="tkb-day-sub">({shortDayMonth(d)})</span>
                      </div>
                      <div className="small dim" style={{ fontSize: 11, fontWeight: 500, marginTop: 2 }}>
                        {ptCount}/8 ca PT
                      </div>
                    </th>
                  );
                })}
                <th className="tkb-nav-col">
                  <button
                    type="button"
                    className="tkb-nav-btn"
                    onClick={() => setWeekIdx((w) => Math.min(2, w + 1))}
                    disabled={weekIdx >= 2}
                    title="Tuần kế tiếp"
                  >
                    <ArrowRight size={15} />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {GYM_TIME_SLOTS.map((slotDef) => (
                <tr key={slotDef.id}>
                  <td className="tkb-slot-cell">
                    <div className="tkb-slot-badge">{slotDef.label}</div>
                  </td>
                  {days.map((d) => {
                    const isToday = d === todayStr();
                    const cellClasses = sessions.filter(
                      (s) => s.date === d && matchSlotId(s.startAt) === slotDef.id,
                    );
                    const cellSlots = slots.filter(
                      (s) =>
                        new Date(s.startAt).toLocaleDateString('sv-SE') === d &&
                        matchSlotId(s.startAt) === slotDef.id,
                    );

                    return (
                      <td key={`${slotDef.id}-${d}`} className={`tkb-data-cell ${isToday ? 'is-today-col' : ''}`}>
                        {cellClasses.map((x) => {
                          const c = L.classById(db, x.classId)!;
                          const br = L.branchById(db, c.branchId);
                          return (
                            <div
                              key={x.id}
                              className="tkb-event"
                              style={{ ['--ev-color' as string]: c.color, cursor: 'default' }}
                            >
                              <div className="tkb-ev-title">{c.name}</div>
                              <div className="tkb-ev-line">Lớp nhóm · {br?.name}</div>
                              <div className="tkb-ev-line">Phòng: {x.room}</div>
                              <div className="tkb-ev-time">
                                <span>
                                  🕒 {fmtTime(x.startAt)} → {fmtTime(x.endAt)}
                                </span>
                                <span className="tkb-ev-tag">Lớp dạy</span>
                              </div>
                            </div>
                          );
                        })}

                        {cellSlots.map((sl) => {
                          const bk = db.ptBookings.find(
                            (b) => b.slotId === sl.id && ['pending', 'confirmed', 'completed'].includes(b.status),
                          );
                          const br = L.branchById(db, sl.branchId);
                          const canDelete = !bk && new Date(sl.startAt).getTime() > now;
                          return (
                            <div
                              key={sl.id}
                              className={`tkb-event ${bk ? 'is-pt' : 'is-mine'}`}
                              style={{ cursor: 'default' }}
                            >
                              <div className="row between">
                                <div className="tkb-ev-title">
                                  {bk ? `PT: ${L.userById(db, bk.memberId)?.fullName}` : 'Ca PT Mở Trống'}
                                </div>
                                {canDelete && (
                                  <button
                                    type="button"
                                    className="btn ghost sm"
                                    style={{ padding: '2px 4px', height: 'auto', color: '#f87171' }}
                                    onClick={() => act((dd) => L.removeSlot(dd, sl.id), 'Đã xóa khung giờ')}
                                    title="Xóa khung giờ trống"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </div>
                              <div className="tkb-ev-line">Cơ sở: {br?.name}</div>
                              {bk?.note && <div className="tkb-ev-line">Ghi chú: {bk.note}</div>}
                              <div className="tkb-ev-time">
                                <span>
                                  🕒 {fmtTime(sl.startAt)} → {fmtTime(sl.endAt)}
                                </span>
                                <span className="tkb-ev-tag">
                                  {bk ? ptbLabel[bk.status][0] : 'Trống'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </td>
                    );
                  })}
                  <td className="tkb-time-cell">
                    <div className="tkb-time-badge">{slotDef.timeLabel}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ================= Lớp dạy & điểm danh ================= */
export function TrainerClasses() {
  const { db, user } = useApp();
  const [tab, setTab] = useState<'up' | 'mark' | 'done'>('mark');
  const [sel, setSel] = useState<string | null>(null);
  const s = useTrainerStats();
  const done = s.sessions.filter((x) => x.attendanceConfirmed).reverse();
  const myClasses = db.classes.filter((c) => c.trainerId === user!.id && c.active);
  const list = tab === 'up' ? s.upcomingSessions : tab === 'mark' ? [...s.toMark].reverse() : done;
  return (
    <>
      <PageHead title="Lớp dạy & điểm danh" desc={`Phụ trách ${myClasses.length} lớp: ${myClasses.map((c) => c.name).join(', ')}`} />
      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'mark', label: 'Cần điểm danh', count: s.toMark.length }, { id: 'up', label: 'Sắp tới' }, { id: 'done', label: 'Đã điểm danh' }]} />
      {list.length === 0 ? <div className="card"><Empty text="Không có buổi học" /></div> : (
        <div className="grid g-auto">
          {list.slice(0, 30).map((x) => {
            const c = L.classById(db, x.classId)!;
            const bk = L.sessionBookings(db, x.id);
            const booked = bk.filter((b) => ['booked', 'attended', 'no_show'].includes(b.status)).length;
            const att = bk.filter((b) => b.status === 'attended').length;
            return (
              <div className="card hover" key={x.id} style={{ borderTop: `3px solid ${c.color}`, cursor: 'pointer' }} onClick={() => setSel(x.id)}>
                <div className="row between"><b>{c.name}</b>{x.status === 'cancelled' ? <Badge color="red">Đã hủy</Badge> : x.attendanceConfirmed ? <Badge color="green">{att}/{booked} có mặt</Badge> : <Badge color="gray">{booked}/{c.capacity}</Badge>}</div>
                <div className="small muted mt8"><CalendarDays size={13} /> {fmtWeekday(x.startAt)}, {fmtDateTime(x.startAt)}</div>
                <div className="small muted"><MapPin size={13} /> {x.room} · {L.branchById(db, c.branchId)?.name}</div>
                {L.waitlistOf(db, x.id).length > 0 && <div className="small mt8" style={{ color: '#ffc857' }}>{L.waitlistOf(db, x.id).length} người trong danh sách chờ</div>}
              </div>
            );
          })}
        </div>
      )}
      {sel && <AttendanceModal sessionId={sel} onClose={() => setSel(null)} />}
    </>
  );
}

function AttendanceModal({ sessionId, onClose }: { sessionId: string; onClose: () => void }) {
  const { db, act } = useApp();
  const s = L.sessionById(db, sessionId)!;
  const c = L.classById(db, s.classId)!;
  const bookings = L.sessionBookings(db, s.id).filter((b) => ['booked', 'attended', 'no_show'].includes(b.status));
  const waitlist = L.waitlistOf(db, s.id);
  const checked = (mid: string, b: { checkedIn: boolean }) => b.checkedIn || L.hasCheckinOn(db, mid, c.branchId, s.date);
  const [sel, setSel] = useState<string[]>(() => bookings.filter((b) => b.status === 'attended' || (b.status === 'booked' && checked(b.memberId, b))).map((b) => b.memberId));
  const started = new Date(s.startAt).getTime() <= Date.now();
  const save = () => {
    act((d) => L.confirmAttendance(d, s.id, sel), (rej) => (rej ? `Đã lưu điểm danh. ${rej} hội viên chưa check-in hợp lệ bị ghi vắng.` : 'Đã xác nhận danh sách tham gia'));
    onClose();
  };
  return (
    <Modal wide title={`${c.name} · ${fmtDateTime(s.startAt)}`} onClose={onClose} footer={started && s.status !== 'cancelled' ? <><button className="btn" onClick={onClose}>Đóng</button><button className="btn primary" onClick={save} id="attendance-save"><ClipboardCheck size={16} /> Xác nhận danh sách tham gia</button></> : undefined}>
      {!started && <div className="card mb16 small muted">Buổi học chưa bắt đầu – điểm danh sẽ mở khi đến giờ học.</div>}
      {bookings.length === 0 ? <Empty text="Chưa có học viên đăng ký" /> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Có mặt</th><th>Hội viên</th><th>Check-in tại CN</th><th>Trạng thái</th></tr></thead>
            <tbody>
              {bookings.map((b) => {
                const m = L.userById(db, b.memberId);
                const ok = checked(b.memberId, b);
                return (
                  <tr key={b.id}>
                    <td><label className="check"><input type="checkbox" disabled={!started || s.status === 'cancelled'} checked={sel.includes(b.memberId)} onChange={(e) => setSel(e.target.checked ? [...sel, b.memberId] : sel.filter((x) => x !== b.memberId))} /></label></td>
                    <td><div className="row"><Avatar user={m} size="sm" /><div><b>{m?.fullName}</b><div className="small dim">{m?.cardCode}</div></div></div></td>
                    <td>{ok ? <Badge color="green">Đã check-in</Badge> : <Badge color="gray">Chưa check-in</Badge>}</td>
                    <td><Badge color={cbLabel[b.status][1]}>{cbLabel[b.status][0]}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div className="small dim mt8">* Chỉ hội viên đã check-in hợp lệ tại chi nhánh trong ngày mới được ghi nhận tham gia và mở quyền đánh giá.</div>
      {waitlist.length > 0 && (
        <>
          <h3 className="mt16 mb16">Danh sách chờ ({waitlist.length})</h3>
          <div className="col">{waitlist.map((b, i) => <div className="row small" key={b.id}><Badge color="amber" plain>#{i + 1}</Badge>{L.userById(db, b.memberId)?.fullName}<span className="dim">· ưu tiên {b.priority} · {fmtDateTime(b.createdAt)}</span></div>)}</div>
        </>
      )}
    </Modal>
  );
}

/* ================= Đánh giá ================= */
export function TrainerReviews() {
  const { db } = useApp();
  const s = useTrainerStats();
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: s.reviews.filter((r) => r.rating === n).length }));
  return (
    <>
      <PageHead title="Đánh giá của tôi" desc="Phản hồi từ hội viên sau các buổi PT và lớp nhóm." />
      <div className="grid g3 mb16">
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 52, fontWeight: 800 }} className="grad-text">{s.avg ? s.avg.toFixed(2) : '—'}</div>
          <Stars value={s.avg} size={20} />
          <div className="small muted mt8">{s.reviews.length} đánh giá</div>
        </div>
        <div className="card span2">
          {dist.map((d) => (
            <div className="row mb16" key={d.n} style={{ marginBottom: 8 }}>
              <span className="small" style={{ width: 40 }}>{d.n} ★</span>
              <div className="progress grow"><div style={{ width: `${s.reviews.length ? (d.c / s.reviews.length) * 100 : 0}%`, background: 'var(--grad-amber)' }} /></div>
              <span className="small dim" style={{ width: 30, textAlign: 'right' }}>{d.c}</span>
            </div>
          ))}
        </div>
      </div>
      {s.reviews.length === 0 ? <div className="card"><Empty text="Chưa có đánh giá" /></div> : (
        <div className="grid g2">
          {s.reviews.map((r) => {
            const m = L.userById(db, r.memberId);
            return (
              <div className="card" key={r.id}>
                <div className="row"><Avatar user={m} size="sm" /><div className="grow"><b>{m?.fullName}</b><div className="small dim">{fmtDate(r.createdAt)} · {r.targetType === 'trainer' ? 'Buổi PT' : `Lớp ${L.classById(db, r.classId ?? '')?.name}`}</div></div><Stars value={r.rating} size={14} /></div>
                {r.comment && <p className="muted mt8">“{r.comment}”</p>}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

/* ================= Hồ sơ chuyên môn ================= */
export function TrainerProfile() {
  const { db, user, act } = useApp();
  const t = user!.trainer!;
  const [f, setF] = useState({ fullName: user!.fullName, phone: user!.phone, bio: t.bio, exp: t.experienceYears, spec: t.specialties.join(', '), cert: t.certifications.join(', '), branches: t.branchIds });
  const save = () =>
    act((d) => {
      const u = d.users.find((x) => x.id === user!.id)!;
      if (!f.branches.length) throw new Error('Chọn ít nhất một chi nhánh làm việc');
      u.fullName = f.fullName;
      u.phone = f.phone;
      u.trainer = { bio: f.bio, experienceYears: +f.exp, specialties: f.spec.split(',').map((x) => x.trim()).filter(Boolean), certifications: f.cert.split(',').map((x) => x.trim()).filter(Boolean), branchIds: f.branches };
    }, 'Đã cập nhật hồ sơ chuyên môn');
  return (
    <>
      <PageHead title="Hồ sơ chuyên môn" desc="Thông tin hiển thị cho hội viên khi chọn HLV." />
      <div className="grid g3">
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}><Avatar user={user!} size="lg" /></div>
          <h2 className="mt16">{f.fullName}</h2>
          <div className="row wrap mt8" style={{ justifyContent: 'center' }}>{f.spec.split(',').filter((x) => x.trim()).map((x) => <Badge key={x} color="purple" plain>{x.trim()}</Badge>)}</div>
          <div className="row mt16" style={{ justifyContent: 'center' }}><Award size={16} color="#ffc857" /> {f.exp} năm kinh nghiệm</div>
          <p className="small muted mt16">{f.bio}</p>
        </div>
        <div className="card span2">
          <div className="form-grid">
            <div className="field"><label>Họ tên</label><input className="input" value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} /></div>
            <div className="field"><label>Số điện thoại</label><input className="input" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
            <div className="field"><label>Số năm kinh nghiệm</label><input type="number" className="input" value={f.exp} onChange={(e) => setF({ ...f, exp: +e.target.value })} /></div>
            <div className="field"><label>Chuyên môn (phân tách dấu phẩy)</label><input className="input" value={f.spec} onChange={(e) => setF({ ...f, spec: e.target.value })} id="trainer-spec" /></div>
            <div className="field full"><label>Chứng chỉ</label><input className="input" value={f.cert} onChange={(e) => setF({ ...f, cert: e.target.value })} /></div>
            <div className="field full"><label>Giới thiệu</label><textarea className="input" value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} /></div>
            <div className="field full"><label>Chi nhánh làm việc</label><div className="chips">{db.branches.map((b) => <button key={b.id} className={`chip ${f.branches.includes(b.id) ? 'on' : ''}`} onClick={() => setF({ ...f, branches: f.branches.includes(b.id) ? f.branches.filter((x) => x !== b.id) : [...f.branches, b.id] })}>{b.name}</button>)}</div></div>
          </div>
          <div className="row mt16" style={{ justifyContent: 'flex-end' }}><button className="btn primary" onClick={save} id="trainer-save"><Save size={16} /> Lưu hồ sơ</button></div>
        </div>
      </div>
    </>
  );
}
export { Users };
