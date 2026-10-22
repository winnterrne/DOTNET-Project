import { useMemo, useState } from 'react';
import {
  CalendarDays,
  Users,
  Clock,
  MapPin,
  Dumbbell,
  Star,
  Award,
  Gift,
  MessageSquare,
  X,
  ListOrdered,
  Search,
  Sunrise,
  Sun,
  Sunset,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  LayoutGrid,
  List,
  Printer,
  Settings,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../../store/AppContext';
import * as L from '../../store/logic';
import { Avatar, Badge, Empty, Modal, PageHead, Stars, Tabs, ConfirmModal, Progress } from '../../components/ui';
import { cbLabel, ptbLabel } from '../../components/labels';
import { addDays, todayStr, fmtTime, fmtDate, WEEKDAYS, parseDate, fmtDateTime, hoursUntil, fmtWeekday } from '../../utils';
import type { ClassSession } from '../../types';

type PeriodKey = 'morning' | 'afternoon' | 'evening';

const PERIOD_META: { key: PeriodKey; label: string; sub: string; color: string; icon: typeof Sunrise }[] = [
  { key: 'morning', label: 'Ca Sáng', sub: '05:30 – 12:00', color: '#0284c7', icon: Sunrise },
  { key: 'afternoon', label: 'Ca Chiều', sub: '12:00 – 17:00', color: '#d97706', icon: Sun },
  { key: 'evening', label: 'Ca Tối', sub: '17:00 – 22:00', color: '#4f46e5', icon: Sunset },
];

function getPeriodKey(isoStart: string): PeriodKey {
  const h = new Date(isoStart).getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

/** 10 Ca tập tiêu chuẩn trong ngày (hiển thị cột trái Ca 1..10 & cột phải Giờ bắt đầu như mẫu TKB) */
export interface GymSlotDef {
  id: number;
  label: string;
  timeLabel: string;
  minMinutes: number;
  maxMinutes: number;
  isEvening?: boolean;
}

export const GYM_TIME_SLOTS: GymSlotDef[] = [
  { id: 1, label: 'Ca 1', timeLabel: '06:30', minMinutes: 0, maxMinutes: 7 * 60 + 14 },
  { id: 2, label: 'Ca 2', timeLabel: '07:30', minMinutes: 7 * 60 + 15, maxMinutes: 8 * 60 + 29 },
  { id: 3, label: 'Ca 3', timeLabel: '09:00', minMinutes: 8 * 60 + 30, maxMinutes: 9 * 60 + 59 },
  { id: 4, label: 'Ca 4', timeLabel: '10:15', minMinutes: 10 * 60, maxMinutes: 12 * 60 + 59 },
  { id: 5, label: 'Ca 5', timeLabel: '14:00', minMinutes: 13 * 60, maxMinutes: 15 * 60 + 14 },
  { id: 6, label: 'Ca 6', timeLabel: '15:30', minMinutes: 15 * 60 + 15, maxMinutes: 16 * 60 + 59 },
  { id: 7, label: 'Ca 7', timeLabel: '17:30', minMinutes: 17 * 60, maxMinutes: 18 * 60 + 14, isEvening: true },
  { id: 8, label: 'Ca 8', timeLabel: '18:30', minMinutes: 18 * 60 + 15, maxMinutes: 19 * 60 + 14, isEvening: true },
  { id: 9, label: 'Ca 9', timeLabel: '19:30', minMinutes: 19 * 60 + 15, maxMinutes: 20 * 60 + 29, isEvening: true },
  { id: 10, label: 'Ca 10', timeLabel: '20:30', minMinutes: 20 * 60 + 30, maxMinutes: 23 * 60 + 59, isEvening: true },
];

export function matchSlotId(isoStart: string): number {
  const dt = new Date(isoStart);
  const mins = dt.getHours() * 60 + dt.getMinutes();
  const found = GYM_TIME_SLOTS.find((s) => mins >= s.minMinutes && mins <= s.maxMinutes);
  return found ? found.id : 1;
}

/** Tính ngày Thứ 2 đầu tuần của một ngày YYYY-MM-DD */
export function getMondayStr(baseDate: string, weekDiff = 0): string {
  const d = parseDate(baseDate);
  const day = d.getDay(); // 0 = CN, 1 = T2 ... 6 = T7
  const diffToMon = day === 0 ? -6 : 1 - day;
  return addDays(baseDate, diffToMon + weekDiff * 7);
}

export function fullDayName(dateStr: string): string {
  const day = parseDate(dateStr).getDay();
  return day === 0 ? 'Chủ Nhật' : `Thứ ${day + 1}`;
}

export function shortDayMonth(dateStr: string): string {
  const d = parseDate(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/* ================= Lớp học nhóm & Thời khóa biểu dạng tuần ================= */
export function MemberClasses() {
  const { db, user, act } = useApp();
  const [viewMode, setViewMode] = useState<'week' | 'agenda'>('week');
  const [weekIdx, setWeekIdx] = useState<number>(0); // -1: tuần trước, 0: tuần này, 1: tuần sau
  const [selectedDate, setSelectedDate] = useState<string>(todayStr());
  const [branch, setBranch] = useState<string>('all');
  const [cat, setCat] = useState<string>('all');
  const [scheduleScope, setScheduleScope] = useState<'all_classes' | 'my_schedule'>('all_classes');
  const [showEvening, setShowEvening] = useState<boolean>(true);
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const [sel, setSel] = useState<ClassSession | null>(null);

  const monday = getMondayStr(todayStr(), weekIdx);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(monday, i)), [monday]);

  const cats = [...new Set(db.classes.filter((c) => c.active).map((c) => c.category))];
  const current = L.membershipOn(db, user!.id);
  const plan = current ? L.planById(db, current.planId) : undefined;

  const myBooking = (sid: string) =>
    db.classBookings.find(
      (b) => b.sessionId === sid && b.memberId === user!.id && ['booked', 'waitlist', 'attended'].includes(b.status),
    );

  const sessions = db.sessions
    .filter((s) => days.includes(s.date))
    .filter((s) => {
      const c = L.classById(db, s.classId);
      if (!c) return false;
      if (branch !== 'all' && c.branchId !== branch) return false;
      if (cat !== 'all' && c.category !== cat) return false;
      if (scheduleScope === 'my_schedule' && !myBooking(s.id)) return false;
      if (onlyAvailable) {
        const cnt = L.bookedCount(db, s.id);
        if (cnt >= c.capacity) return false;
      }
      return true;
    })
    .sort((a, b) => a.startAt.localeCompare(b.startAt));

  // Các buổi PT 1-kèm-1 của hội viên trong tuần (hiển thị khi chọn "Thời khóa biểu cá nhân" hoặc trên bảng tuần)
  const myWeekPT = useMemo(() => {
    return db.ptBookings.filter(
      (b) =>
        b.memberId === user!.id &&
        ['pending', 'confirmed', 'completed'].includes(b.status) &&
        days.includes(b.startAt.slice(0, 10)) &&
        (branch === 'all' || b.branchId === branch),
    );
  }, [db.ptBookings, user, days, branch]);

  const agendaSessions = sessions.filter((s) => s.date === selectedDate);

  const activeBookedCount = db.classBookings.filter(
    (b) => b.memberId === user!.id && ['booked', 'waitlist'].includes(b.status),
  ).length;
  const maxWeeklyQuota = plan?.classBookingsPerWeek ? `${plan.classBookingsPerWeek}` : 'Không giới hạn';

  const visibleSlots = showEvening ? GYM_TIME_SLOTS : GYM_TIME_SLOTS.filter((s) => !s.isEvening);

  const weekOptions = [
    { val: -1, label: `Tuần trước [từ ngày ${fmtDate(getMondayStr(todayStr(), -1))} đến ngày ${fmtDate(addDays(getMondayStr(todayStr(), -1), 6))}]` },
    { val: 0, label: `Tuần hiện tại [từ ngày ${fmtDate(getMondayStr(todayStr(), 0))} đến ngày ${fmtDate(addDays(getMondayStr(todayStr(), 0), 6))}]` },
    { val: 1, label: `Tuần kế tiếp [từ ngày ${fmtDate(getMondayStr(todayStr(), 1))} đến ngày ${fmtDate(addDays(getMondayStr(todayStr(), 1), 6))}]` },
  ];

  return (
    <>
      <PageHead
        title="Thời Khóa Biểu & Đặt Lịch Lớp Nhóm (TP.HCM)"
        desc={
          plan ? (
            <>
              Gói <b>{plan.name}</b> · Hạn mức <b>{maxWeeklyQuota} lớp/tuần</b> (Đang giữ chỗ: <b>{activeBookedCount}</b>) ·{' '}
              {L.scopeLabel(db, plan.branchScope)}
            </>
          ) : (
            'Bạn cần gói hội viên còn hiệu lực để đặt lịch lớp học nhóm.'
          )
        }
        actions={
          <div className="tabs" style={{ padding: 3, marginBottom: 0 }}>
            <button className={`tab ${viewMode === 'week' ? 'on' : ''}`} onClick={() => setViewMode('week')}>
              <LayoutGrid size={14} style={{ marginRight: 5 }} /> Thời khóa biểu dạng tuần
            </button>
            <button className={`tab ${viewMode === 'agenda' ? 'on' : ''}`} onClick={() => setViewMode('agenda')}>
              <List size={14} style={{ marginRight: 5 }} /> Danh sách theo ca trong ngày
            </button>
          </div>
        }
      />

      {/* CHẾ ĐỘ XEM 1: THỜI KHÓA BIỂU DẠNG TUẦN (GIỐNG MẪU PORTAL ĐẠI HỌC) */}
      {viewMode === 'week' && (
        <div className="tkb-wrapper">
          <div className="tkb-header-bar">
            <div className="tkb-header-title">
              <Settings size={16} color="var(--primary)" />
              <span>THỜI KHÓA BIỂU DẠNG TUẦN – HỆ THỐNG DFGYM TP.HCM</span>
            </div>
            <div className="row small muted">
              <ShieldCheck size={15} color="var(--primary)" />
              <span>Click vào bất kỳ ô lớp học nào trên bảng để xem chi tiết & đặt chỗ</span>
            </div>
          </div>

          {/* Thanh công cụ lọc 2 tầng giống hệt mẫu ảnh */}
          <div className="tkb-toolbar">
            <div className="tkb-toolbar-row">
              <select className="tkb-select" value={branch} onChange={(e) => setBranch(e.target.value)}>
                <option value="all">Tất cả cơ sở DFGym tại TP.HCM ({db.branches.length} quận)</option>
                {db.branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} – {b.address.split(',').slice(-2).join(',')}
                  </option>
                ))}
              </select>

              <select
                className="tkb-select"
                value={scheduleScope}
                onChange={(e) => setScheduleScope(e.target.value as 'all_classes' | 'my_schedule')}
              >
                <option value="all_classes">Thời khóa biểu toàn trung tâm (Tất cả lớp nhóm)</option>
                <option value="my_schedule">Thời khóa biểu cá nhân (Lớp đã đăng ký & PT của tôi)</option>
              </select>

              <select className="tkb-select" value={cat} onChange={(e) => setCat(e.target.value)} style={{ minWidth: 190 }}>
                <option value="all">Bộ môn: Tất cả bộ môn</option>
                {cats.map((c) => (
                  <option key={c} value={c}>
                    Bộ môn: {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="tkb-toolbar-row">
              <select
                className="tkb-select"
                style={{ minWidth: 340 }}
                value={weekIdx}
                onChange={(e) => setWeekIdx(Number(e.target.value))}
              >
                {weekOptions.map((w) => (
                  <option key={w.val} value={w.val}>
                    {w.label}
                  </option>
                ))}
              </select>

              <button className="btn sm" onClick={() => window.print()}>
                <Printer size={14} /> In thời khóa biểu
              </button>

              <label className="check small bold">
                <input type="checkbox" checked={showEvening} onChange={(e) => setShowEvening(e.target.checked)} />
                <span>Thời khóa biểu tối (sau 17:00)</span>
              </label>

              <label className="check small bold">
                <input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} />
                <span>Chỉ lớp còn chỗ</span>
              </label>

              <div className="tkb-legend" style={{ marginLeft: 'auto' }}>
                <span className="tkb-legend-item">
                  <span className="tkb-swatch" style={{ background: '#38bdf8' }} /> Lớp mở đăng ký
                </span>
                <span className="tkb-legend-item">
                  <span className="tkb-swatch" style={{ background: '#10b981' }} /> Đã đăng ký
                </span>
                <span className="tkb-legend-item">
                  <span className="tkb-swatch" style={{ background: '#a855f7' }} /> Lịch PT 1-kèm-1
                </span>
                <span className="tkb-legend-item">
                  <span className="tkb-swatch" style={{ background: '#f59e0b' }} /> Kín chỗ / Chờ
                </span>
              </div>
            </div>
          </div>

          {/* BẢNG THỜI KHÓA BIỂU DẠNG TUẦN CHUẨN */}
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
                    return (
                      <th key={d} className={isToday ? 'is-today' : ''}>
                        <span>{fullDayName(d)}</span>
                        <span className="tkb-day-sub">({shortDayMonth(d)})</span>
                      </th>
                    );
                  })}
                  <th className="tkb-nav-col">
                    <button
                      type="button"
                      className="tkb-nav-btn"
                      onClick={() => setWeekIdx((w) => Math.min(1, w + 1))}
                      disabled={weekIdx >= 1}
                      title="Tuần kế tiếp"
                    >
                      <ArrowRight size={15} />
                    </button>
                  </th>
                </tr>
              </thead>

              <tbody>
                {visibleSlots.map((slotDef) => (
                  <tr key={slotDef.id}>
                    <td className="tkb-slot-cell">
                      <div className="tkb-slot-badge">{slotDef.label}</div>
                    </td>

                    {days.map((d) => {
                      const isToday = d === todayStr();
                      const cellSessions = sessions.filter(
                        (s) => s.date === d && matchSlotId(s.startAt) === slotDef.id,
                      );
                      const cellPTs = myWeekPT.filter(
                        (b) => b.startAt.slice(0, 10) === d && matchSlotId(b.startAt) === slotDef.id,
                      );

                      return (
                        <td key={`${slotDef.id}-${d}`} className={`tkb-data-cell ${isToday ? 'is-today-col' : ''}`}>
                          {cellSessions.map((s) => {
                            const c = L.classById(db, s.classId)!;
                            const tr = L.userById(db, s.trainerId);
                            const br = L.branchById(db, c.branchId);
                            const cnt = L.bookedCount(db, s.id);
                            const mine = myBooking(s.id);
                            const full = cnt >= c.capacity;

                            return (
                              <div
                                key={s.id}
                                className={`tkb-event ${mine ? 'is-mine' : full ? 'is-full' : ''}`}
                                style={{ ['--ev-color' as string]: c.color }}
                                onClick={() => setSel(s)}
                                id={`session-${s.id}`}
                              >
                                <div className="tkb-ev-title">{c.name}</div>
                                <div className="tkb-ev-line">Cơ sở: {br?.name}</div>
                                <div className="tkb-ev-line">
                                  Phòng: {s.room} ({cnt}/{c.capacity})
                                </div>
                                <div className="tkb-ev-line">HLV: {tr?.fullName}</div>
                                <div className="tkb-ev-time">
                                  <span>
                                    🕒 {fmtTime(s.startAt)} → {fmtTime(s.endAt)}
                                  </span>
                                  {mine ? (
                                    <span className="tkb-ev-tag">
                                      {mine.status === 'waitlist' ? 'Chờ' : '✓ Đã đặt'}
                                    </span>
                                  ) : full ? (
                                    <span className="tkb-ev-tag" style={{ background: 'rgba(245,158,11,0.25)', color: '#fbbf24' }}>
                                      Kín chỗ
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            );
                          })}

                          {cellPTs.map((pt) => {
                            const tr = L.userById(db, pt.trainerId);
                            const br = L.branchById(db, pt.branchId);
                            return (
                              <div key={pt.id} className="tkb-event is-pt">
                                <div className="tkb-ev-title">PT 1-kèm-1 (Cá nhân)</div>
                                <div className="tkb-ev-line">Cơ sở: {br?.name}</div>
                                <div className="tkb-ev-line">HLV: {tr?.fullName}</div>
                                {pt.note && <div className="tkb-ev-line">Mục tiêu: {pt.note}</div>}
                                <div className="tkb-ev-time">
                                  <span>
                                    🕒 {fmtTime(pt.startAt)} → {fmtTime(pt.endAt)}
                                  </span>
                                  <span className="tkb-ev-tag">{ptbLabel[pt.status][0]}</span>
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

              <tfoot>
                <tr>
                  <th className="tkb-nav-col">
                    <button
                      type="button"
                      className="tkb-nav-btn"
                      onClick={() => setWeekIdx((w) => Math.max(-1, w - 1))}
                      disabled={weekIdx <= -1}
                    >
                      <ArrowLeft size={15} />
                    </button>
                  </th>
                  {days.map((d) => {
                    const isToday = d === todayStr();
                    return (
                      <th key={d} className={isToday ? 'is-today' : ''}>
                        <span>{fullDayName(d)}</span>
                        <span className="tkb-day-sub">({shortDayMonth(d)})</span>
                      </th>
                    );
                  })}
                  <th className="tkb-nav-col">
                    <button
                      type="button"
                      className="tkb-nav-btn"
                      onClick={() => setWeekIdx((w) => Math.min(1, w + 1))}
                      disabled={weekIdx >= 1}
                    >
                      <ArrowRight size={15} />
                    </button>
                  </th>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* CHẾ ĐỘ XEM 2: THEO CA TRONG NGÀY (SÁNG / CHIỀU / TỐI) */}
      {viewMode === 'agenda' && (
        <>
          <div className="card mb16" style={{ padding: '14px 16px' }}>
            <div className="row between wrap mb12" style={{ gap: 12 }}>
              <div className="small bold muted">Chọn ngày trong tuần ({fmtDate(days[0])} – {fmtDate(days[6])}):</div>
              <div className="row" style={{ gap: 8 }}>
                <button
                  className="btn sm"
                  onClick={() => {
                    setWeekIdx(0);
                    setSelectedDate(todayStr());
                  }}
                >
                  Hôm nay
                </button>
                <button
                  className="btn sm"
                  onClick={() => {
                    setWeekIdx(0);
                    setSelectedDate(addDays(todayStr(), 1));
                  }}
                >
                  Ngày mai
                </button>
              </div>
            </div>

            <div className="day-strip">
              {days.map((d) => {
                const isSelected = d === selectedDate;
                const isToday = d === todayStr();
                const daySessions = sessions.filter((s) => s.date === d);
                const hasMine = daySessions.some((s) => !!myBooking(s.id));
                const dateObj = parseDate(d);

                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDate(d)}
                    className={`day-pill ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                  >
                    <div className="small muted">{isToday ? 'Hôm nay' : WEEKDAYS[dateObj.getDay()]}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: isSelected ? 'var(--primary)' : 'var(--text)' }}>
                      {dateObj.getDate()}/{dateObj.getMonth() + 1}
                    </div>
                    <div className="small dim" style={{ fontSize: 11 }}>
                      {daySessions.length > 0 ? `${daySessions.length} lớp` : 'Nghỉ'}
                      {hasMine ? ' · ✓' : ''}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card mb20" style={{ padding: '12px 16px' }}>
            <div className="row wrap between" style={{ gap: 12 }}>
              <div className="chips">
                <button className={`chip ${branch === 'all' ? 'on' : ''}`} onClick={() => setBranch('all')}>
                  Tất cả quận TP.HCM
                </button>
                {db.branches.map((b) => (
                  <button key={b.id} className={`chip ${branch === b.id ? 'on' : ''}`} onClick={() => setBranch(b.id)}>
                    {b.name.replace('DFGym ', '')}
                  </button>
                ))}
              </div>
              <div className="chips">
                <button className={`chip ${cat === 'all' ? 'on' : ''}`} onClick={() => setCat('all')}>
                  Mọi bộ môn
                </button>
                {cats.map((c) => (
                  <button key={c} className={`chip ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="col" style={{ gap: 20 }}>
            {agendaSessions.length === 0 ? (
              <div className="card" style={{ padding: 40, textAlign: 'center' }}>
                <Empty text="Không có lớp học nào trong ngày này phù hợp với bộ lọc." icon={<CalendarDays size={38} />} />
              </div>
            ) : (
              PERIOD_META.map((period) => {
                const pList = agendaSessions.filter((s) => getPeriodKey(s.startAt) === period.key);
                if (pList.length === 0) return null;
                const PIcon = period.icon;
                return (
                  <div key={period.key} className="col" style={{ gap: 12 }}>
                    <div className="period-header">
                      <div className="row" style={{ gap: 10 }}>
                        <PIcon size={18} color={period.color} />
                        <span className="bold" style={{ fontSize: 14.5 }}>
                          {period.label} ({period.sub})
                        </span>
                      </div>
                      <Badge color="purple" plain>
                        {pList.length} lớp
                      </Badge>
                    </div>

                    <div className="grid g2" style={{ gap: 14 }}>
                      {pList.map((s) => {
                        const c = L.classById(db, s.classId)!;
                        const tr = L.userById(db, s.trainerId);
                        const cnt = L.bookedCount(db, s.id);
                        const wl = L.waitlistOf(db, s.id);
                        const mine = myBooking(s.id);
                        const full = cnt >= c.capacity;
                        const past = new Date(s.startAt).getTime() < Date.now();
                        const fillPercent = Math.min(100, Math.round((cnt / c.capacity) * 100));

                        return (
                          <div
                            key={s.id}
                            className="card hover"
                            style={{
                              borderLeft: `5px solid ${c.color}`,
                              padding: 16,
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              gap: 12,
                              opacity: past && s.status !== 'cancelled' ? 0.65 : 1,
                            }}
                            onClick={() => setSel(s)}
                          >
                            <div>
                              <div className="row between wrap mb8" style={{ gap: 8 }}>
                                <div className="row" style={{ gap: 8 }}>
                                  <span style={{ fontSize: 15, fontWeight: 800, color: c.color }}>
                                    {fmtTime(s.startAt)} – {fmtTime(s.endAt)}
                                  </span>
                                  <span className="small dim">({c.durationMin} phút)</span>
                                </div>
                                <div className="row" style={{ gap: 6 }}>
                                  <Badge color="purple" plain>
                                    {c.category}
                                  </Badge>
                                  {mine ? (
                                    <Badge color={cbLabel[mine.status][1]}>
                                      {mine.status === 'waitlist' ? 'Đang chờ' : '✓ Đã đặt chỗ'}
                                    </Badge>
                                  ) : full ? (
                                    <Badge color="amber">Kín chỗ ({wl.length} chờ)</Badge>
                                  ) : (
                                    <Badge color="green">Còn {c.capacity - cnt} chỗ</Badge>
                                  )}
                                </div>
                              </div>

                              <h3 style={{ fontSize: 16, marginBottom: 6 }}>{c.name}</h3>

                              <div className="row between wrap small muted" style={{ gap: 8 }}>
                                <div className="row" style={{ gap: 7 }}>
                                  <Avatar user={tr} size="sm" />
                                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>HLV {tr?.fullName}</span>
                                </div>
                                <div className="row" style={{ gap: 5 }}>
                                  <MapPin size={13} className="dim" />
                                  <span>
                                    {s.room} · {L.branchById(db, c.branchId)?.name}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div style={{ paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                              <div className="row between small mb6">
                                <span className="dim">Sĩ số lớp:</span>
                                <span style={{ fontWeight: 700 }}>
                                  {cnt}/{c.capacity} học viên ({fillPercent}%)
                                </span>
                              </div>
                              <Progress value={fillPercent} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {sel && (
        <SessionModal
          session={db.sessions.find((x) => x.id === sel.id)!}
          onClose={() => setSel(null)}
          onBook={() => act((d) => L.bookClass(d, user!.id, sel.id))}
        />
      )}
    </>
  );
}

function SessionModal({ session: s, onClose, onBook }: { session: ClassSession; onClose: () => void; onBook: () => void }) {
  const { db, user, act } = useApp();
  const c = L.classById(db, s.classId)!;
  const tr = L.userById(db, s.trainerId);
  const cnt = L.bookedCount(db, s.id);
  const wl = L.waitlistOf(db, s.id);
  const mine = db.classBookings.find(
    (b) => b.sessionId === s.id && b.memberId === user!.id && ['booked', 'waitlist', 'attended', 'no_show'].includes(b.status),
  );
  const full = cnt >= c.capacity;
  const h = hoursUntil(s.startAt);
  const past = h <= 0;
  const reviews = db.reviews.filter((r) => r.classId === c.id);
  const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;
  return (
    <Modal title={c.name} onClose={onClose}>
      <div className="row wrap mb16">
        <Badge color="purple">{c.category}</Badge>
        {s.status === 'cancelled' && <Badge color="red">Đã hủy{s.note ? `: ${s.note}` : ''}</Badge>}
        {reviews.length > 0 && (
          <span className="row small">
            <Stars value={avg} size={14} /> {avg.toFixed(1)} ({reviews.length})
          </span>
        )}
      </div>
      <p className="muted">{c.description}</p>
      <div className="mt16">
        <div className="kv">
          <span>
            <Clock size={14} /> Thời gian
          </span>
          <span>
            {fmtWeekday(s.startAt)}, {fmtDateTime(s.startAt)} · {c.durationMin} phút
          </span>
        </div>
        <div className="kv">
          <span>
            <MapPin size={14} /> Địa điểm
          </span>
          <span>
            {s.room} · {L.branchById(db, c.branchId)?.name}
          </span>
        </div>
        <div className="kv">
          <span>
            <Dumbbell size={14} /> Huấn luyện viên
          </span>
          <span>{tr?.fullName}</span>
        </div>
        <div className="kv">
          <span>
            <Users size={14} /> Đã đăng ký
          </span>
          <span>
            {cnt}/{c.capacity} {wl.length > 0 && `· ${wl.length} người chờ`}
          </span>
        </div>
      </div>
      <div className="mt8">
        <Progress value={(cnt / c.capacity) * 100} color={full ? 'linear-gradient(90deg,#dc2626,#ea580c)' : undefined} />
      </div>
      {mine?.status === 'waitlist' && (
        <div className="card mt16" style={{ background: 'rgba(217, 119, 6, 0.08)' }}>
          <div className="row">
            <ListOrdered size={18} color="var(--amber)" />
            <b>Bạn ở vị trí #{wl.findIndex((b) => b.id === mine.id) + 1} trong danh sách chờ</b>
          </div>
          <div className="small muted mt8">
            Thứ tự dựa trên mức ưu tiên gói và thời điểm đăng ký. Hệ thống tự xếp chỗ khi có người hủy; nếu đến{' '}
            {db.settings.waitlistCutoffHours} giờ trước giờ học vẫn chưa có chỗ, bạn sẽ được thông báo chọn lớp khác.
          </div>
        </div>
      )}
      <div className="row mt24" style={{ justifyContent: 'flex-end' }}>
        {mine && ['booked', 'waitlist'].includes(mine.status) ? (
          <>
            <span className="small muted grow">
              {mine.status === 'booked' &&
                (h >= db.settings.cancelDeadlineHours
                  ? `Hủy trước ${db.settings.cancelDeadlineHours}h để được hoàn lượt.`
                  : '⚠️ Đã quá hạn hủy – hủy sẽ bị tính lượt.')}
            </span>
            <button
              className="btn danger"
              onClick={() => {
                act((d) => L.cancelClassBooking(d, user!.id, mine.id));
                onClose();
              }}
              id="cancel-class"
            >
              Hủy đăng ký
            </button>
          </>
        ) : mine ? (
          <Badge color={cbLabel[mine.status][1]}>{cbLabel[mine.status][0]}</Badge>
        ) : (
          <button
            className="btn primary"
            disabled={past || s.status !== 'scheduled'}
            onClick={() => {
              onBook();
            }}
            id="book-class"
          >
            {past ? 'Đã diễn ra' : full ? 'Vào danh sách chờ' : 'Đặt chỗ ngay'}
          </button>
        )}
      </div>
    </Modal>
  );
}

/* ================= Đặt lịch PT ================= */
const PT_GOAL_SUGGESTIONS = [
  'Đốt mỡ vùng bụng & HIIT Cardio',
  'Tăng cơ thân trên (Ngực - Vai - Tay)',
  'Kiểm tra form Squat & Deadlift an toàn',
  'Tập cơ trọng tâm (Core) & Giãn cơ phục hồi',
];

export function MemberPT() {
  const { db, user, act } = useApp();
  const allTrainers = db.users.filter((u) => u.role === 'trainer' && !u.locked);

  const [searchTrainer, setSearchTrainer] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [tid, setTid] = useState(allTrainers[0]?.id);
  const [slot, setSlot] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [timeOfDay, setTimeOfDay] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all');
  const [selectedDate, setSelectedDate] = useState<string>('all');

  const bal = L.ptBalance(db, user!.id);
  const tr = L.userById(db, tid);
  const now = Date.now();

  const specialties = useMemo(() => {
    const set = new Set<string>();
    allTrainers.forEach((t) => t.trainer?.specialties.forEach((s) => set.add(s)));
    return Array.from(set);
  }, [allTrainers]);

  const filteredTrainers = useMemo(() => {
    return allTrainers.filter((t) => {
      if (searchTrainer.trim() && !t.fullName.toLowerCase().includes(searchTrainer.toLowerCase().trim())) {
        return false;
      }
      if (selectedSpecialty !== 'all' && !t.trainer?.specialties.includes(selectedSpecialty)) {
        return false;
      }
      if (selectedBranch !== 'all' && !t.trainer?.branchIds.includes(selectedBranch)) {
        return false;
      }
      return true;
    });
  }, [allTrainers, searchTrainer, selectedSpecialty, selectedBranch]);

  const rawSlots = useMemo(() => {
    return db.trainerSlots
      .filter((s) => s.trainerId === tid && new Date(s.startAt).getTime() > now)
      .sort((a, b) => a.startAt.localeCompare(b.startAt));
  }, [db.trainerSlots, tid, now]);

  const availableDates = useMemo(() => {
    const dates = Array.from(new Set(rawSlots.map((s) => s.startAt.slice(0, 10))));
    return dates;
  }, [rawSlots]);

  const slots = useMemo(() => {
    return rawSlots.filter((s) => {
      const d = s.startAt.slice(0, 10);
      if (selectedDate !== 'all' && d !== selectedDate) return false;

      const hour = new Date(s.startAt).getHours();
      if (timeOfDay === 'morning' && hour >= 12) return false;
      if (timeOfDay === 'afternoon' && (hour < 12 || hour >= 17)) return false;
      if (timeOfDay === 'evening' && hour < 17) return false;

      return true;
    });
  }, [rawSlots, selectedDate, timeOfDay]);

  const byDay = useMemo(() => {
    return slots.reduce<Record<string, typeof slots>>((acc, s) => {
      const d = s.startAt.slice(0, 10);
      (acc[d] ||= []).push(s);
      return acc;
    }, {});
  }, [slots]);

  const rating = (id: string) => {
    const rs = db.reviews.filter((r) => r.trainerId === id);
    return { avg: rs.length ? rs.reduce((a, r) => a + r.rating, 0) / rs.length : 0, n: rs.length };
  };

  const book = () => {
    if (!slot) return;
    const r = act((d) => L.bookPT(d, user!.id, slot, note), 'Đã gửi yêu cầu đặt lịch, chờ HLV xác nhận');
    if (r) {
      setSlot(null);
      setNote('');
    }
  };

  const sel = rawSlots.find((s) => s.id === slot);

  return (
    <>
      <PageHead
        title="Đặt Lịch HLV Cá Nhân (PT 1-kèm-1)"
        desc="Quy trình 3 bước rõ ràng: Chọn HLV chuyên môn → Chọn Ca rảnh theo buổi → Chọn mục tiêu tập & Xác nhận."
        actions={
          <div className="card row" style={{ padding: '8px 16px', gap: 16 }}>
            <span className="row small">
              <Gift size={16} color="var(--primary)" /> Tặng kèm: <b style={{ color: 'var(--primary)' }}>{bal.free} buổi</b>
            </span>
            <span className="row small">
              <Dumbbell size={16} color="var(--accent)" /> Gói PT: <b style={{ color: 'var(--accent)' }}>{bal.pkg} buổi</b>
            </span>
          </div>
        }
      />

      {/* Thanh quy trình 3 bước */}
      <div className="grid g3 mb16" style={{ gap: 12 }}>
        <div className="card row" style={{ padding: '12px 16px', borderLeft: '4px solid var(--primary)' }}>
          <Badge color="purple">Bước 1</Badge>
          <div className="small">
            <div className="bold">Chọn Huấn luyện viên</div>
            <div className="dim">Đang chọn: {tr?.fullName || 'Chưa chọn'}</div>
          </div>
        </div>
        <div className="card row" style={{ padding: '12px 16px', borderLeft: `4px solid ${sel ? 'var(--accent)' : 'var(--border)'}` }}>
          <Badge color={sel ? 'green' : 'gray'}>Bước 2</Badge>
          <div className="small">
            <div className="bold">Chọn Ngày & Khung giờ rảnh</div>
            <div className="dim">{sel ? `${fmtDate(sel.startAt)} · ${fmtTime(sel.startAt)}` : 'Chọn 1 ca trống bên dưới'}</div>
          </div>
        </div>
        <div className="card row" style={{ padding: '12px 16px', borderLeft: `4px solid ${note ? 'var(--amber)' : 'var(--border)'}` }}>
          <Badge color={note ? 'amber' : 'gray'}>Bước 3</Badge>
          <div className="small">
            <div className="bold">Mục tiêu & Xác nhận đặt</div>
            <div className="dim">Đặt trước tối thiểu {db.settings.cancelDeadlineHours}h</div>
          </div>
        </div>
      </div>

      {/* THANH BỘ LỌC HUẤN LUYỆN VIÊN */}
      <div className="card mb16" style={{ padding: 14 }}>
        <div className="row wrap between" style={{ gap: 12 }}>
          <div className="row wrap grow" style={{ gap: 10 }}>
            <div style={{ position: 'relative', minWidth: 220 }}>
              <Search size={15} className="dim" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                className="input sm"
                style={{ paddingLeft: 32, width: '100%' }}
                placeholder="Tìm theo tên HLV..."
                value={searchTrainer}
                onChange={(e) => setSearchTrainer(e.target.value)}
              />
            </div>

            <select
              className="input sm"
              style={{ minWidth: 160 }}
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
            >
              <option value="all">Tất cả chuyên môn</option>
              {specialties.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              className="input sm"
              style={{ minWidth: 170 }}
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
            >
              <option value="all">Tất cả cơ sở TP.HCM</option>
              {db.branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <span className="small muted">
            Hiển thị <b>{filteredTrainers.length}</b> huấn luyện viên
          </span>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(280px, 330px) 1fr', gap: 18 }}>
        {/* DANH SÁCH HLV */}
        <div className="col" style={{ gap: 10 }}>
          {filteredTrainers.length === 0 ? (
            <div className="card" style={{ padding: 24, textAlign: 'center' }}>
              <Empty text="Không tìm thấy HLV phù hợp bộ lọc." />
              <button
                className="btn sm ghost mt8"
                onClick={() => {
                  setSearchTrainer('');
                  setSelectedSpecialty('all');
                  setSelectedBranch('all');
                }}
              >
                Đặt lại bộ lọc
              </button>
            </div>
          ) : (
            filteredTrainers.map((t) => {
              const r = rating(t.id);
              const isSel = t.id === tid;
              const openSlotsCount = db.trainerSlots.filter(
                (s) => s.trainerId === t.id && new Date(s.startAt).getTime() > now && !L.slotTaken(db, s.id),
              ).length;

              return (
                <div
                  key={t.id}
                  className={`card hover ${isSel ? 'border-primary' : ''}`}
                  style={{
                    padding: 13,
                    cursor: 'pointer',
                    background: isSel ? 'rgba(79, 70, 229, 0.08)' : undefined,
                    border: isSel ? '2px solid var(--primary)' : '1px solid var(--border)',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => {
                    setTid(t.id);
                    setSlot(null);
                    setSelectedDate('all');
                  }}
                  id={`trainer-${t.id}`}
                >
                  <div className="row" style={{ gap: 12, alignItems: 'center' }}>
                    <Avatar user={t} />
                    <div className="grow" style={{ minWidth: 0 }}>
                      <div className="row between">
                        <span className="bold" style={{ fontSize: 15, color: isSel ? 'var(--primary)' : 'var(--text)' }}>
                          {t.fullName}
                        </span>
                        {openSlotsCount > 0 ? (
                          <Badge color="green" plain>
                            {openSlotsCount} ca trống
                          </Badge>
                        ) : (
                          <span className="small dim">Hết ca</span>
                        )}
                      </div>
                      <div className="small dim truncate" style={{ marginTop: 2 }}>
                        {t.trainer?.specialties.join(' · ')}
                      </div>
                      <div className="row between small mt8" style={{ alignItems: 'center' }}>
                        <div className="row" style={{ gap: 4 }}>
                          <Stars value={r.avg} size={13} />
                          <span className="bold">{r.avg ? r.avg.toFixed(1) : '5.0'}</span>
                          <span className="dim">({r.n})</span>
                        </div>
                        <span className="dim">{t.trainer?.experienceYears} năm KN</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* CHI TIẾT HLV & CHỌN LỊCH RẢNH */}
        {tr && (
          <div className="col" style={{ gap: 18 }}>
            <div className="card" style={{ padding: 20 }}>
              <div className="row" style={{ gap: 18, alignItems: 'flex-start' }}>
                <Avatar user={tr} size="lg" />
                <div className="grow">
                  <div className="row between wrap" style={{ gap: 8 }}>
                    <div>
                      <h2 style={{ fontSize: 20, marginBottom: 4 }}>HLV {tr.fullName}</h2>
                      <div className="row wrap" style={{ gap: 6 }}>
                        {tr.trainer?.specialties.map((s) => (
                          <Badge key={s} color="purple">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div
                      className="row small"
                      style={{ gap: 6, background: 'var(--surface-2)', padding: '6px 12px', borderRadius: 8 }}
                    >
                      <Stars value={rating(tr.id).avg} size={15} />
                      <span className="bold">{rating(tr.id).avg ? rating(tr.id).avg.toFixed(1) : '5.0'}</span>
                      <span className="dim">({rating(tr.id).n} đánh giá)</span>
                    </div>
                  </div>

                  <p className="muted mt8" style={{ lineHeight: 1.55 }}>
                    {tr.trainer?.bio ||
                      'Huấn luyện viên tận tâm, kinh nghiệm xây dựng giáo án cá nhân hóa đạt chuẩn quốc tế.'}
                  </p>

                  <div className="row wrap small muted mt12" style={{ gap: 16 }}>
                    <span className="row" style={{ gap: 6 }}>
                      <Award size={15} color="var(--primary)" />
                      <b>{tr.trainer?.experienceYears} năm</b> kinh nghiệm
                    </span>
                    <span className="row" style={{ gap: 6 }}>
                      <CheckCircle2 size={15} color="var(--teal)" />
                      {tr.trainer?.certifications.join(', ')}
                    </span>
                    <span className="row" style={{ gap: 6 }}>
                      <MapPin size={15} color="var(--amber)" />
                      {tr.trainer?.branchIds.map((b) => L.branchById(db, b)?.name).join(', ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-head between wrap" style={{ gap: 12 }}>
                <div>
                  <h2>
                    <CalendarDays size={18} /> Lịch Rảnh Của HLV {tr.fullName}
                  </h2>
                  <span className="small muted">
                    Chỉ các khung giờ cách hiện tại tối thiểu {db.settings.cancelDeadlineHours} giờ mới có thể đặt lịch
                  </span>
                </div>

                <div className="chips">
                  <button className={`chip ${timeOfDay === 'all' ? 'on' : ''}`} onClick={() => setTimeOfDay('all')}>
                    Tất cả buổi
                  </button>
                  <button
                    className={`chip ${timeOfDay === 'morning' ? 'on' : ''}`}
                    onClick={() => setTimeOfDay('morning')}
                  >
                    <Sunrise size={13} style={{ marginRight: 4 }} /> Sáng (5h30–12h)
                  </button>
                  <button
                    className={`chip ${timeOfDay === 'afternoon' ? 'on' : ''}`}
                    onClick={() => setTimeOfDay('afternoon')}
                  >
                    <Sun size={13} style={{ marginRight: 4 }} /> Chiều (12h–17h)
                  </button>
                  <button
                    className={`chip ${timeOfDay === 'evening' ? 'on' : ''}`}
                    onClick={() => setTimeOfDay('evening')}
                  >
                    <Sunset size={13} style={{ marginRight: 4 }} /> Tối (17h–22h)
                  </button>
                </div>
              </div>

              {availableDates.length > 1 && (
                <div className="row wrap pb8 mb16" style={{ gap: 8, borderBottom: '1px solid var(--border)' }}>
                  <button
                    className={`btn sm ${selectedDate === 'all' ? 'primary' : 'ghost'}`}
                    onClick={() => setSelectedDate('all')}
                  >
                    Tất cả ngày ({rawSlots.length})
                  </button>
                  {availableDates.map((d) => {
                    const count = rawSlots.filter((s) => s.startAt.startsWith(d)).length;
                    const isCur = selectedDate === d;
                    return (
                      <button
                        key={d}
                        className={`btn sm ${isCur ? 'primary' : 'ghost'}`}
                        onClick={() => setSelectedDate(d)}
                      >
                        {fmtWeekday(d)}, {fmtDate(d).slice(0, 5)} ({count})
                      </button>
                    );
                  })}
                </div>
              )}

              {slots.length === 0 ? (
                <div style={{ padding: '30px 20px', textAlign: 'center' }}>
                  <Empty text="Không có khung giờ rảnh nào phù hợp với bộ lọc buổi hoặc ngày này." />
                </div>
              ) : (
                <div className="col" style={{ gap: 18 }}>
                  {Object.entries(byDay).map(([d, list]) => (
                    <div key={d}>
                      <div className="period-header mb8">
                        <span className="bold" style={{ fontSize: 13.5, color: 'var(--primary)' }}>
                          📅 {fmtWeekday(d)}, ngày {fmtDate(d)}
                        </span>
                        <span className="small dim">{list.length} khung giờ</span>
                      </div>

                      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: 10 }}>
                        {list.map((s) => {
                          const taken = L.slotTaken(db, s.id);
                          const tooSoon = hoursUntil(s.startAt) < db.settings.cancelDeadlineHours;
                          const disabled = taken || tooSoon;
                          const isSel = slot === s.id;
                          const startMs = new Date(s.startAt).getTime();
                          const endMs = new Date(s.endAt).getTime();
                          const durMin = Math.round((endMs - startMs) / 60000);
                          const branchObj = L.branchById(db, s.branchId);
                          const pKey = getPeriodKey(s.startAt);
                          const pLabel = pKey === 'morning' ? 'Sáng' : pKey === 'afternoon' ? 'Chiều' : 'Tối';

                          return (
                            <button
                              key={s.id}
                              className={`card hover ${isSel ? 'border-primary' : ''}`}
                              disabled={disabled}
                              onClick={() => setSlot(s.id)}
                              style={{
                                padding: 13,
                                textAlign: 'left',
                                cursor: disabled ? 'not-allowed' : 'pointer',
                                background: isSel
                                  ? 'rgba(79, 70, 229, 0.1)'
                                  : disabled
                                    ? 'var(--surface-2)'
                                    : 'var(--surface)',
                                border: isSel ? '2px solid var(--primary)' : '1px solid var(--border)',
                                opacity: disabled ? 0.52 : 1,
                              }}
                              id={`slot-${s.id}`}
                            >
                              <div className="row between mb4">
                                <span
                                  style={{
                                    fontWeight: 800,
                                    fontSize: 14.5,
                                    color: isSel ? 'var(--primary)' : 'var(--text)',
                                  }}
                                >
                                  {fmtTime(s.startAt)} – {fmtTime(s.endAt)}
                                </span>
                                <Badge color={durMin === 90 ? 'purple' : durMin === 60 ? 'blue' : 'amber'} plain>
                                  {durMin}p
                                </Badge>
                              </div>

                              <div className="small dim truncate">
                                📍 {branchObj?.name || 'Chi nhánh'} · Ca {pLabel}
                              </div>

                              <div className="row between mt8 small">
                                {taken ? (
                                  <span style={{ color: 'var(--red)', fontWeight: 600 }}>Đã có người đặt</span>
                                ) : tooSoon ? (
                                  <span style={{ color: 'var(--amber)', fontWeight: 600 }}>Sát giờ (&lt;2h)</span>
                                ) : isSel ? (
                                  <span style={{ color: 'var(--primary)', fontWeight: 700 }}>✓ Đang chọn</span>
                                ) : (
                                  <span style={{ color: 'var(--green)', fontWeight: 600 }}>● Còn trống</span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {sel && (
                <div
                  className="card mt16"
                  style={{
                    background: 'rgba(79, 70, 229, 0.08)',
                    borderColor: 'var(--primary)',
                    padding: 18,
                  }}
                >
                  <div className="row between wrap mb8" style={{ gap: 8 }}>
                    <div className="bold" style={{ fontSize: 16 }}>
                      Xác nhận ca tập: {fmtWeekday(sel.startAt)}, {fmtDateTime(sel.startAt)} (
                      {Math.round((new Date(sel.endAt).getTime() - new Date(sel.startAt).getTime()) / 60000)} phút)
                    </div>
                    <Badge color="green">{L.branchById(db, sel.branchId)?.name}</Badge>
                  </div>

                  <div className="small muted mb12" style={{ lineHeight: 1.5 }}>
                    📌 Huấn luyện viên: <b>{tr.fullName}</b>. Sẽ trừ <b>1 buổi</b> (ưu tiên{' '}
                    {bal.free > 0 ? 'buổi tặng kèm của gói hội viên' : 'từ gói PT cá nhân'}). Hủy trước{' '}
                    {db.settings.cancelDeadlineHours} giờ hoặc HLV từ chối lịch sẽ được hoàn lại 100% buổi tập.
                  </div>

                  <div className="mb12">
                    <div className="small bold mb6" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Sparkles size={14} color="var(--primary)" /> Chọn nhanh mục tiêu buổi tập:
                    </div>
                    <div className="chips">
                      {PT_GOAL_SUGGESTIONS.map((g) => (
                        <button
                          key={g}
                          type="button"
                          className={`chip ${note === g ? 'on' : ''}`}
                          onClick={() => setNote(g)}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="row wrap" style={{ gap: 10 }}>
                    <input
                      className="input grow"
                      placeholder="Ghi chú cho HLV (vd: mục tiêu buổi tập, thể lực, chấn thương nếu có...)"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      id="pt-note"
                    />
                    <button
                      className="btn primary"
                      onClick={book}
                      disabled={bal.total === 0}
                      id="pt-book"
                      style={{ minWidth: 150 }}
                    >
                      Xác nhận đặt lịch
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ================= Lịch của tôi ================= */
type Row = {
  id: string;
  kind: 'class' | 'pt';
  at: string;
  end: string;
  title: string;
  roomOrBranch: string;
  trainerName: string;
  sub: string;
  status: [string, string];
  raw: string;
  canCancel: boolean;
  canReview: boolean;
  reviewed: boolean;
  source?: string;
};

export function MemberBookings() {
  const { db, user, act } = useApp();
  const [tab, setTab] = useState<'up' | 'past'>('up');
  const [kindFilter, setKindFilter] = useState<'all' | 'class' | 'pt'>('all');
  const [layoutMode, setLayoutMode] = useState<'calendar' | 'list'>('calendar');
  const [weekIdx, setWeekIdx] = useState<number>(0);
  const [review, setReview] = useState<Row | null>(null);
  const [cancel, setCancel] = useState<Row | null>(null);
  const uid = user!.id;

  const rows: Row[] = useMemo(() => {
    const now = Date.now();
    const cls: Row[] = db.classBookings
      .filter((b) => b.memberId === uid)
      .map((b) => {
        const s = L.sessionById(db, b.sessionId)!;
        const c = L.classById(db, s.classId)!;
        const brName = L.branchById(db, c.branchId)?.name ?? '';
        const trName = L.userById(db, s.trainerId)?.fullName ?? '';
        return {
          id: b.id,
          kind: 'class',
          at: s.startAt,
          end: s.endAt,
          title: c.name,
          roomOrBranch: `${s.room} · ${brName}`,
          trainerName: trName,
          raw: b.status,
          sub: `${s.room} · ${brName} · HLV ${trName}`,
          status: cbLabel[b.status],
          canCancel: ['booked', 'waitlist'].includes(b.status) && new Date(s.startAt).getTime() > now,
          canReview: b.status === 'attended',
          reviewed: db.reviews.some((r) => r.bookingId === b.id),
        };
      });
    const pts: Row[] = db.ptBookings
      .filter((b) => b.memberId === uid)
      .map((b) => {
        const brName = L.branchById(db, b.branchId)?.name ?? '';
        const trName = L.userById(db, b.trainerId)?.fullName ?? '';
        return {
          id: b.id,
          kind: 'pt',
          at: b.startAt,
          end: b.endAt,
          title: `PT 1-kèm-1 · ${trName}`,
          roomOrBranch: `Khu PT · ${brName}`,
          trainerName: trName,
          raw: b.status,
          sub: `${brName}${b.note ? ' · ' + b.note : ''}`,
          status: ptbLabel[b.status],
          canCancel: ['pending', 'confirmed'].includes(b.status) && new Date(b.startAt).getTime() > now,
          canReview: b.status === 'completed',
          reviewed: db.reviews.some((r) => r.bookingId === b.id),
          source: b.source.type === 'membership_free' ? 'Buổi tặng kèm' : 'Gói PT',
        };
      });
    return [...cls, ...pts];
  }, [db, uid]);

  const active = ['booked', 'waitlist', 'pending', 'confirmed'];
  const up = rows
    .filter((r) => active.includes(r.raw) && new Date(r.end).getTime() > Date.now())
    .sort((a, b) => a.at.localeCompare(b.at));
  const past = rows.filter((r) => !up.includes(r)).sort((a, b) => b.at.localeCompare(a.at));
  const baseList = tab === 'up' ? up : past;
  const list = baseList.filter((r) => (kindFilter === 'all' ? true : r.kind === kindFilter));
  const toReview = past.filter((r) => r.canReview && !r.reviewed).length;

  const monday = getMondayStr(todayStr(), weekIdx);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  const doCancel = () => {
    if (!cancel) return;
    act((d) => (cancel.kind === 'class' ? L.cancelClassBooking(d, uid, cancel.id) : L.cancelPTByMember(d, uid, cancel.id)));
    setCancel(null);
  };

  return (
    <>
      <PageHead
        title="Thời Khóa Biểu Cá Nhân Của Tôi"
        desc="Quản lý tập trung toàn bộ lịch Lớp nhóm và buổi PT 1-kèm-1 đã đăng ký theo chuẩn bảng tuần."
        actions={
          <div className="tabs" style={{ padding: 3, marginBottom: 0 }}>
            <button
              className={`tab ${layoutMode === 'calendar' ? 'on' : ''}`}
              onClick={() => {
                setLayoutMode('calendar');
                setTab('up');
              }}
            >
              <LayoutGrid size={14} style={{ marginRight: 5 }} /> Thời khóa biểu dạng tuần
            </button>
            <button className={`tab ${layoutMode === 'list' ? 'on' : ''}`} onClick={() => setLayoutMode('list')}>
              <List size={14} style={{ marginRight: 5 }} /> Danh sách & Lịch sử ({rows.length})
            </button>
          </div>
        }
      />

      {layoutMode === 'calendar' ? (
        <div className="tkb-wrapper">
          <div className="tkb-header-bar">
            <div className="tkb-header-title">
              <Settings size={16} color="var(--primary)" />
              <span>THỜI KHÓA BIỂU CÁ NHÂN DẠNG TUẦN – {user!.fullName.toUpperCase()}</span>
            </div>
            <div className="tkb-legend">
              <span className="tkb-legend-item">
                <span className="tkb-swatch" style={{ background: '#10b981' }} /> Lớp học nhóm ({up.filter((x) => x.kind === 'class').length})
              </span>
              <span className="tkb-legend-item">
                <span className="tkb-swatch" style={{ background: '#a855f7' }} /> PT 1-kèm-1 ({up.filter((x) => x.kind === 'pt').length})
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
                    >
                      <ArrowLeft size={15} />
                    </button>
                  </th>
                  {weekDays.map((d) => {
                    const isToday = d === todayStr();
                    return (
                      <th key={d} className={isToday ? 'is-today' : ''}>
                        <span>{fullDayName(d)}</span>
                        <span className="tkb-day-sub">({shortDayMonth(d)})</span>
                      </th>
                    );
                  })}
                  <th className="tkb-nav-col">
                    <button
                      type="button"
                      className="tkb-nav-btn"
                      onClick={() => setWeekIdx((w) => Math.min(1, w + 1))}
                      disabled={weekIdx >= 1}
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
                    {weekDays.map((d) => {
                      const isToday = d === todayStr();
                      const cellItems = rows.filter(
                        (r) =>
                          !['cancelled', 'late_cancelled', 'rejected'].includes(r.raw) &&
                          r.at.slice(0, 10) === d &&
                          matchSlotId(r.at) === slotDef.id,
                      );
                      return (
                        <td key={`${slotDef.id}-${d}`} className={`tkb-data-cell ${isToday ? 'is-today-col' : ''}`}>
                          {cellItems.map((item) => (
                            <div
                              key={item.id}
                              className={`tkb-event ${item.kind === 'pt' ? 'is-pt' : 'is-mine'}`}
                            >
                              <div className="tkb-ev-title">{item.title}</div>
                              <div className="tkb-ev-line">{item.roomOrBranch}</div>
                              <div className="tkb-ev-line">HLV: {item.trainerName}</div>
                              <div className="tkb-ev-time">
                                <span>
                                  🕒 {fmtTime(item.at)} → {fmtTime(item.end)}
                                </span>
                                <span className="tkb-ev-tag">{item.status[0]}</span>
                              </div>
                              {item.canCancel && (
                                <button
                                  type="button"
                                  className="btn sm danger mt4"
                                  style={{ width: '100%', padding: '3px 6px', fontSize: 11 }}
                                  onClick={() => setCancel(item)}
                                >
                                  <X size={11} /> Hủy lịch
                                </button>
                              )}
                            </div>
                          ))}
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
      ) : (
        <>
          <div className="row between wrap mb16" style={{ gap: 12 }}>
            <Tabs
              value={tab}
              onChange={setTab}
              tabs={[
                { id: 'up', label: 'Sắp tới', count: up.length },
                { id: 'past', label: 'Lịch sử & Đánh giá', count: toReview },
              ]}
            />
            <div className="chips">
              <button className={`chip ${kindFilter === 'all' ? 'on' : ''}`} onClick={() => setKindFilter('all')}>
                Tất cả loại hình
              </button>
              <button className={`chip ${kindFilter === 'class' ? 'on' : ''}`} onClick={() => setKindFilter('class')}>
                Lớp học nhóm
              </button>
              <button className={`chip ${kindFilter === 'pt' ? 'on' : ''}`} onClick={() => setKindFilter('pt')}>
                PT 1-kèm-1
              </button>
            </div>
          </div>

          {list.length === 0 ? (
            <div className="card">
              <Empty text={tab === 'up' ? 'Không có lịch sắp tới phù hợp bộ lọc' : 'Chưa có lịch sử tập luyện'} />
            </div>
          ) : (
            <div className="col">
              {list.map((r) => (
                <div className="list-item" key={r.id}>
                  <div className="date-box">
                    <div className="d">{new Date(r.at).getDate()}</div>
                    <div className="m">Th{new Date(r.at).getMonth() + 1}</div>
                  </div>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="row wrap">
                      <b>{r.title}</b>
                      <Badge color={r.kind === 'pt' ? 'blue' : 'purple'} plain>
                        {r.kind === 'pt' ? 'PT 1-kèm-1' : 'Lớp nhóm'}
                      </Badge>
                      {r.source && <span className="small dim">· {r.source}</span>}
                    </div>
                    <div className="small muted">
                      {fmtWeekday(r.at)} · <b>{fmtTime(r.at)}–{fmtTime(r.end)}</b> · {r.sub}
                    </div>
                  </div>
                  <Badge color={r.status[1]}>{r.status[0]}</Badge>
                  {r.canCancel && (
                    <button className="btn sm danger" onClick={() => setCancel(r)} id={`cancel-${r.id}`}>
                      <X size={14} /> Hủy
                    </button>
                  )}
                  {r.canReview &&
                    (r.reviewed ? (
                      <Badge color="amber" plain>
                        <Star size={12} /> Đã đánh giá
                      </Badge>
                    ) : (
                      <button className="btn sm primary" onClick={() => setReview(r)} id={`review-${r.id}`}>
                        <MessageSquare size={14} /> Đánh giá
                      </button>
                    ))}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {cancel && (
        <ConfirmModal
          title="Hủy lịch"
          danger
          confirmText="Xác nhận hủy"
          message={
            <>
              Bạn muốn hủy <b>{cancel.title}</b> lúc {fmtDateTime(cancel.at)}?
              <br />
              <br />
              {cancel.raw === 'waitlist' ||
              cancel.raw === 'pending' ||
              hoursUntil(cancel.at) >= db.settings.cancelDeadlineHours
                ? `✅ Hủy đúng hạn – ${cancel.kind === 'pt' ? 'buổi PT được hoàn lại vào nguồn đã trừ' : 'lượt đặt được hoàn lại'}.`
                : `⚠️ Còn dưới ${db.settings.cancelDeadlineHours} giờ – ${cancel.kind === 'pt' ? 'buổi PT' : 'lượt đặt'} sẽ bị tính là đã sử dụng.`}
            </>
          }
          onClose={() => setCancel(null)}
          onConfirm={doCancel}
        />
      )}
      {review && <ReviewModal row={review} onClose={() => setReview(null)} />}
    </>
  );
}

function ReviewModal({ row, onClose }: { row: Row; onClose: () => void }) {
  const { user, act } = useApp();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const submit = () => {
    act((d) => L.addReview(d, user!.id, row.id, row.kind, rating, comment), 'Cảm ơn bạn đã đánh giá!');
    onClose();
  };
  return (
    <Modal
      title={`Đánh giá ${row.kind === 'pt' ? 'huấn luyện viên' : 'lớp học'}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Để sau
          </button>
          <button className="btn primary" onClick={submit} id="review-submit">
            Gửi đánh giá
          </button>
        </>
      }
    >
      <div style={{ textAlign: 'center' }}>
        <h3>{row.title}</h3>
        <div className="small muted">{fmtDateTime(row.at)}</div>
        <div className="mt16">
          <Stars value={rating} onChange={setRating} size={34} />
        </div>
        <div className="small muted mt8">{['', 'Rất tệ', 'Chưa tốt', 'Bình thường', 'Tốt', 'Tuyệt vời!'][rating]}</div>
      </div>
      <div className="field mt16">
        <label>Nhận xét</label>
        <textarea
          className="input"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Chia sẻ trải nghiệm của bạn..."
          id="review-comment"
        />
      </div>
    </Modal>
  );
}
