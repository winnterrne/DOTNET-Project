import { useMemo, useState } from 'react';
import { CalendarDays, Users, Clock, MapPin, ChevronLeft, ChevronRight, Dumbbell, Star, Award, Gift, MessageSquare, X, ListOrdered, Search, Sunrise, Sun, Sunset, CheckCircle2, Filter } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import * as L from '../../store/logic';
import { Avatar, Badge, Empty, Modal, PageHead, Stars, Tabs, ConfirmModal, Progress } from '../../components/ui';
import { cbLabel, ptbLabel } from '../../components/labels';
import { addDays, todayStr, fmtTime, fmtDate, WEEKDAYS, parseDate, fmtDateTime, hoursUntil, fmtWeekday } from '../../utils';
import type { ClassSession } from '../../types';

/* ================= Lớp học nhóm ================= */
export function MemberClasses() {
  const { db, user, act } = useApp();
  const [viewMode, setViewMode] = useState<'agenda' | 'week'>('agenda');
  const [offset, setOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr());
  const [branch, setBranch] = useState<string>('all');
  const [cat, setCat] = useState<string>('all');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const [sel, setSel] = useState<ClassSession | null>(null);

  const start = addDays(todayStr(), offset);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const cats = [...new Set(db.classes.filter((c) => c.active).map((c) => c.category))];
  const current = L.membershipOn(db, user!.id);
  const plan = current ? L.planById(db, current.planId) : undefined;

  const sessions = db.sessions
    .filter((s) => days.includes(s.date))
    .filter((s) => {
      const c = L.classById(db, s.classId);
      if (!c) return false;
      if (branch !== 'all' && c.branchId !== branch) return false;
      if (cat !== 'all' && c.category !== cat) return false;
      if (onlyAvailable) {
        const cnt = L.bookedCount(db, s.id);
        if (cnt >= c.capacity) return false;
      }
      return true;
    })
    .sort((a, b) => a.startAt.localeCompare(b.startAt));

  const agendaSessions = sessions.filter((s) => s.date === selectedDate);
  const myBooking = (sid: string) => db.classBookings.find((b) => b.sessionId === sid && b.memberId === user!.id && ['booked', 'waitlist', 'attended'].includes(b.status));

  return (
    <>
      <PageHead
        title="Thời Khóa Biểu & Lớp Học Nhóm"
        desc={
          plan ? (
            <>
              Gói <b>{plan.name}</b> · {plan.classBookingsPerWeek ? `${plan.classBookingsPerWeek} lượt/tuần` : 'Không giới hạn lượt'} · Ưu tiên waitlist cấp {plan.priority} · {L.scopeLabel(db, plan.branchScope)}
              <span className="small muted"> · Hủy lịch trước tối thiểu 2 giờ để được hoàn lượt.</span>
            </>
          ) : (
            'Bạn cần gói hội viên còn hiệu lực để đặt lịch lớp học nhóm.'
          )
        }
        actions={
          <div className="row wrap" style={{ gap: 8 }}>
            <div className="tabs" style={{ padding: 2 }}>
              <button className={`tab ${viewMode === 'agenda' ? 'on' : ''}`} onClick={() => setViewMode('agenda')}>
                Dạng danh sách ngày
              </button>
              <button className={`tab ${viewMode === 'week' ? 'on' : ''}`} onClick={() => setViewMode('week')}>
                Lưới cả tuần
              </button>
            </div>
            <div className="row" style={{ gap: 4 }}>
              <button className="icon-btn" onClick={() => setOffset(Math.max(0, offset - 7))} disabled={offset === 0} title="Tuần trước">
                <ChevronLeft size={18} />
              </button>
              <span className="bold small" style={{ minWidth: 140, textAlign: 'center' }}>
                {fmtDate(days[0])} – {fmtDate(days[6])}
              </span>
              <button className="icon-btn" onClick={() => setOffset(Math.min(14, offset + 7))} disabled={offset >= 14} title="Tuần kế tiếp">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        }
      />

      {/* Thanh chọn ngày trực quan (Day Picker Pills) */}
      <div className="card mb16" style={{ padding: '12px 16px' }}>
        <div className="row between wrap" style={{ gap: 12, marginBottom: 12 }}>
          <div className="small bold muted">Chọn ngày tập luyện:</div>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn sm" onClick={() => { setOffset(0); setSelectedDate(todayStr()); }}>
              Hôm nay
            </button>
            <button className="btn sm" onClick={() => { setOffset(0); setSelectedDate(addDays(todayStr(), 1)); }}>
              Ngày mai
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, overflowX: 'auto' }}>
          {days.map((d) => {
            const isSelected = d === selectedDate;
            const isToday = d === todayStr();
            const count = sessions.filter((s) => s.date === d).length;
            const dateObj = parseDate(d);

            return (
              <button
                key={d}
                type="button"
                onClick={() => setSelectedDate(d)}
                className={`card hover ${isSelected ? 'active-day' : ''}`}
                style={{
                  padding: '10px 8px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  border: isSelected ? '2px solid var(--primary)' : isToday ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid var(--border)',
                  background: isSelected ? 'rgba(99, 102, 241, 0.12)' : isToday ? 'var(--surface-2)' : 'var(--surface)',
                  borderRadius: 12,
                }}
              >
                <div className="small muted" style={{ fontWeight: isSelected ? 700 : 500 }}>
                  {WEEKDAYS[dateObj.getDay()]}
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, margin: '2px 0', color: isSelected ? 'var(--primary)' : 'var(--text)' }}>
                  {dateObj.getDate()}
                </div>
                <div className="small dim" style={{ fontSize: 11 }}>
                  {count > 0 ? `${count} lớp` : 'Nghỉ'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bộ Lọc Chi Nhánh & Bộ Môn */}
      <div className="card mb24" style={{ padding: '14px 18px' }}>
        <div className="row wrap between" style={{ gap: 12 }}>
          <div className="row wrap" style={{ gap: 8 }}>
            <div className="chips">
              <button className={`chip ${branch === 'all' ? 'on' : ''}`} onClick={() => setBranch('all')}>Tất cả chi nhánh</button>
              {db.branches.map((b) => (
                <button key={b.id} className={`chip ${branch === b.id ? 'on' : ''}`} onClick={() => setBranch(b.id)}>
                  {b.name.replace('DFGym ', '')}
                </button>
              ))}
            </div>

            <div className="chips">
              <button className={`chip ${cat === 'all' ? 'on' : ''}`} onClick={() => setCat('all')}>Mọi bộ môn</button>
              {cats.map((c) => (
                <button key={c} className={`chip ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <label className="row small bold" style={{ cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              style={{ accentColor: 'var(--primary)' }}
            />
            <span>Chỉ hiện lớp còn chỗ</span>
          </label>
        </div>
      </div>

      {/* CHẾ ĐỘ XEM 1: DANH SÁCH THEO NGÀY (AGENDA VIEW - THÂN THIỆN NHẤT) */}
      {viewMode === 'agenda' && (
        <div className="col" style={{ gap: 16 }}>
          <div className="row between mb8">
            <h3 style={{ fontSize: 16 }}>
              Lớp học ngày {fmtWeekday(selectedDate)}, {fmtDate(selectedDate)}
            </h3>
            <span className="small muted">{agendaSessions.length} buổi học</span>
          </div>

          {agendaSessions.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <Empty text="Không có lớp học nào trong ngày này phù hợp với bộ lọc." icon={<CalendarDays size={38} />} />
              <button className="btn sm mt16" onClick={() => { setBranch('all'); setCat('all'); setOnlyAvailable(false); }}>
                Xóa bộ lọc
              </button>
            </div>
          ) : (
            <div className="grid g2" style={{ gap: 14 }}>
              {agendaSessions.map((s) => {
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
                      padding: 18,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: 14,
                      opacity: past && s.status !== 'cancelled' ? 0.6 : 1,
                    }}
                    onClick={() => setSel(s)}
                  >
                    <div>
                      {/* Giờ học & Trạng thái */}
                      <div className="row between wrap mb8" style={{ gap: 8 }}>
                        <div className="row" style={{ gap: 8 }}>
                          <span style={{ fontSize: 16, fontWeight: 800, color: c.color }}>
                            {fmtTime(s.startAt)} – {fmtTime(s.endAt)}
                          </span>
                          <span className="small dim">({c.durationMin} phút)</span>
                        </div>
                        <div className="row" style={{ gap: 6 }}>
                          <Badge color="purple" plain>{c.category}</Badge>
                          {mine ? (
                            <Badge color={cbLabel[mine.status][1]}>{mine.status === 'waitlist' ? 'Đang chờ' : '✓ Đã đặt'}</Badge>
                          ) : s.status === 'cancelled' ? (
                            <Badge color="red">Đã hủy</Badge>
                          ) : full ? (
                            <Badge color="amber">Kín chỗ ({wl.length} chờ)</Badge>
                          ) : (
                            <Badge color="green">Còn chỗ</Badge>
                          )}
                        </div>
                      </div>

                      {/* Tên lớp học */}
                      <h3 style={{ fontSize: 16, marginBottom: 6 }}>{c.name}</h3>

                      {/* Thông tin HLV & Phòng */}
                      <div className="col small muted" style={{ gap: 4 }}>
                        <div className="row" style={{ gap: 8 }}>
                          <Avatar user={tr} size="sm" />
                          <span style={{ fontWeight: 600, color: 'var(--text)' }}>HLV {tr?.fullName}</span>
                        </div>
                        <div className="row" style={{ gap: 6 }}>
                          <MapPin size={13} className="dim" />
                          <span>{s.room} · {L.branchById(db, c.branchId)?.name}</span>
                        </div>
                      </div>
                    </div>

                    {/* Tiến độ số chỗ & Nút đặt */}
                    <div style={{ paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                      <div className="row between small mb8">
                        <span className="dim">Tình trạng chỗ:</span>
                        <span style={{ fontWeight: 700, color: full ? 'var(--red)' : 'var(--text)' }}>
                          {cnt}/{c.capacity} người ({fillPercent}%)
                        </span>
                      </div>
                      <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden', marginBottom: 12 }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${fillPercent}%`,
                            background: full ? 'var(--red)' : fillPercent > 70 ? 'var(--amber)' : c.color,
                            borderRadius: 99,
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>

                      <div className="row between">
                        <span className="small dim">{c.description.slice(0, 45)}...</span>
                        <button
                          className={`btn sm ${mine ? 'ghost' : past ? 'ghost' : 'primary'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSel(s);
                          }}
                        >
                          {mine ? 'Xem / Hủy' : past ? 'Đã qua' : full ? 'Vào hàng chờ' : 'Chi tiết & Đặt chỗ'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CHẾ ĐỘ XEM 2: LƯỚI TUẦN TRUYỀN THỐNG (WEEK VIEW) */}
      {viewMode === 'week' && (
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(150px, 1fr))', gap: 10, minWidth: 1050 }}>
            {days.map((d) => {
              const list = sessions.filter((s) => s.date === d);
              return (
                <div className="day-col" key={d}>
                  <div className={`day-head ${d === todayStr() ? 'today' : ''}`}>
                    <div className="small muted">{WEEKDAYS[parseDate(d).getDay()]}</div>
                    <div className="bold" style={{ fontSize: 18 }}>{parseDate(d).getDate()}</div>
                  </div>
                  {list.length === 0 && <div className="small dim" style={{ textAlign: 'center', padding: 12 }}>—</div>}
                  {list.map((s) => {
                    const c = L.classById(db, s.classId)!;
                    const cnt = L.bookedCount(db, s.id);
                    const wl = L.waitlistOf(db, s.id).length;
                    const mine = myBooking(s.id);
                    const past = new Date(s.startAt).getTime() < Date.now();
                    return (
                      <div
                        key={s.id}
                        className={`session-card ${mine ? 'mine' : ''} ${s.status === 'cancelled' ? 'cancelled' : ''}`}
                        style={{ ['--c' as string]: c.color, opacity: past && s.status !== 'cancelled' ? 0.5 : undefined }}
                        onClick={() => setSel(s)}
                        id={`session-${s.id}`}
                      >
                        <div className="small" style={{ color: c.color, fontWeight: 700 }}>{fmtTime(s.startAt)}</div>
                        <div className="bold" style={{ fontSize: 13.5 }}>{c.name}</div>
                        <div className="small dim">{L.branchById(db, c.branchId)?.name.replace('DFGym ', '')}</div>
                        <div className="row between mt8">
                          <span className="small" style={{ color: cnt >= c.capacity ? '#ff8aa0' : 'var(--text-2)' }}>
                            <Users size={12} /> {cnt}/{c.capacity}
                          </span>
                          {mine ? <Badge color={cbLabel[mine.status][1]} plain>{mine.status === 'waitlist' ? 'Chờ' : '✓'}</Badge> : wl > 0 ? <span className="small" style={{ color: '#ffc857' }}>+{wl} chờ</span> : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {sel && <SessionModal session={db.sessions.find((x) => x.id === sel.id)!} onClose={() => setSel(null)} onBook={() => act((d) => L.bookClass(d, user!.id, sel.id))} />}
    </>
  );
}

function SessionModal({ session: s, onClose, onBook }: { session: ClassSession; onClose: () => void; onBook: () => void }) {
  const { db, user, act } = useApp();
  const c = L.classById(db, s.classId)!;
  const tr = L.userById(db, s.trainerId);
  const cnt = L.bookedCount(db, s.id);
  const wl = L.waitlistOf(db, s.id);
  const mine = db.classBookings.find((b) => b.sessionId === s.id && b.memberId === user!.id && ['booked', 'waitlist', 'attended', 'no_show'].includes(b.status));
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
        {reviews.length > 0 && <span className="row small"><Stars value={avg} size={14} /> {avg.toFixed(1)} ({reviews.length})</span>}
      </div>
      <p className="muted">{c.description}</p>
      <div className="mt16">
        <div className="kv"><span><Clock size={14} /> Thời gian</span><span>{fmtWeekday(s.startAt)}, {fmtDateTime(s.startAt)} · {c.durationMin} phút</span></div>
        <div className="kv"><span><MapPin size={14} /> Địa điểm</span><span>{s.room} · {L.branchById(db, c.branchId)?.name}</span></div>
        <div className="kv"><span><Dumbbell size={14} /> Huấn luyện viên</span><span>{tr?.fullName}</span></div>
        <div className="kv"><span><Users size={14} /> Đã đăng ký</span><span>{cnt}/{c.capacity} {wl.length > 0 && `· ${wl.length} người chờ`}</span></div>
      </div>
      <div className="mt8"><Progress value={(cnt / c.capacity) * 100} color={full ? 'linear-gradient(90deg,#ff4d6d,#ff7a45)' : undefined} /></div>
      {mine?.status === 'waitlist' && (
        <div className="card mt16" style={{ background: 'rgba(255,176,32,.08)' }}>
          <div className="row"><ListOrdered size={18} color="#ffc857" /><b>Bạn ở vị trí #{wl.findIndex((b) => b.id === mine.id) + 1} trong danh sách chờ</b></div>
          <div className="small muted mt8">Thứ tự dựa trên mức ưu tiên gói và thời điểm đăng ký. Hệ thống tự xếp chỗ khi có người hủy; nếu đến {db.settings.waitlistCutoffHours} giờ trước giờ học vẫn chưa có chỗ, bạn sẽ được thông báo chọn lớp khác.</div>
        </div>
      )}
      <div className="row mt24" style={{ justifyContent: 'flex-end' }}>
        {mine && ['booked', 'waitlist'].includes(mine.status) ? (
          <>
            <span className="small muted grow">{mine.status === 'booked' && (h >= db.settings.cancelDeadlineHours ? `Hủy trước ${db.settings.cancelDeadlineHours}h để được hoàn lượt.` : '⚠️ Đã quá hạn hủy – hủy sẽ bị tính lượt.')}</span>
            <button className="btn danger" onClick={() => { act((d) => L.cancelClassBooking(d, user!.id, mine.id)); onClose(); }} id="cancel-class">Hủy đăng ký</button>
          </>
        ) : mine ? (
          <Badge color={cbLabel[mine.status][1]}>{cbLabel[mine.status][0]}</Badge>
        ) : (
          <button className="btn primary" disabled={past || s.status !== 'scheduled'} onClick={() => { onBook(); }} id="book-class">
            {past ? 'Đã diễn ra' : full ? 'Vào danh sách chờ' : 'Đặt chỗ'}
          </button>
        )}
      </div>
    </Modal>
  );
}

/* ================= Đặt lịch PT ================= */
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

  // Danh sách các chuyên môn duy nhất từ các HLV
  const specialties = useMemo(() => {
    const set = new Set<string>();
    allTrainers.forEach((t) => t.trainer?.specialties.forEach((s) => set.add(s)));
    return Array.from(set);
  }, [allTrainers]);

  // Bộ lọc HLV
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

  // Các khung giờ của HLV được chọn
  const rawSlots = useMemo(() => {
    return db.trainerSlots
      .filter((s) => s.trainerId === tid && new Date(s.startAt).getTime() > now)
      .sort((a, b) => a.startAt.localeCompare(b.startAt));
  }, [db.trainerSlots, tid, now]);

  // Lấy các ngày có ca rảnh
  const availableDates = useMemo(() => {
    const dates = Array.from(new Set(rawSlots.map((s) => s.startAt.slice(0, 10))));
    return dates;
  }, [rawSlots]);

  // Lọc ca theo ngày và buổi
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

  // Gom nhóm theo ngày
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
        title="Đặt lịch HLV Cá Nhân (PT 1-kèm-1)"
        desc="Lựa chọn huấn luyện viên chuyên nghiệp phù hợp với mục tiêu tăng cơ, giảm mỡ hoặc phục hồi thể lực."
        actions={
          <div className="card row" style={{ padding: '8px 16px', gap: 16 }}>
            <span className="row small">
              <Gift size={16} color="#ff8fb0" /> Tặng kèm: <b style={{ color: '#ff8fb0' }}>{bal.free} buổi</b>
            </span>
            <span className="row small">
              <Dumbbell size={16} color="#00d1b2" /> Gói PT: <b style={{ color: '#00d1b2' }}>{bal.pkg} buổi</b>
            </span>
          </div>
        }
      />

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
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              className="input sm"
              style={{ minWidth: 170 }}
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
            >
              <option value="all">Tất cả cơ sở phòng gym</option>
              {db.branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <span className="small muted">
            Tìm thấy <b>{filteredTrainers.length}</b> huấn luyện viên
          </span>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: 18 }}>
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
                (s) => s.trainerId === t.id && new Date(s.startAt).getTime() > now && !L.slotTaken(db, s.id)
              ).length;

              return (
                <div
                  key={t.id}
                  className={`card hover ${isSel ? 'border-primary' : ''}`}
                  style={{
                    padding: 12,
                    cursor: 'pointer',
                    background: isSel ? 'rgba(124, 92, 255, 0.08)' : undefined,
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
                          <Badge color="green" plain>{openSlotsCount} ca trống</Badge>
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
            {/* HỒ SƠ HLV */}
            <div className="card" style={{ padding: 20 }}>
              <div className="row" style={{ gap: 18, alignItems: 'flex-start' }}>
                <Avatar user={tr} size="lg" />
                <div className="grow">
                  <div className="row between wrap" style={{ gap: 8 }}>
                    <div>
                      <h2 style={{ fontSize: 20, marginBottom: 4 }}>HLV {tr.fullName}</h2>
                      <div className="row wrap" style={{ gap: 6 }}>
                        {tr.trainer?.specialties.map((s) => (
                          <Badge key={s} color="purple">{s}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="row small" style={{ gap: 6, background: 'var(--surface-2)', padding: '6px 12px', borderRadius: 8 }}>
                      <Stars value={rating(tr.id).avg} size={15} />
                      <span className="bold">{rating(tr.id).avg ? rating(tr.id).avg.toFixed(1) : '5.0'}</span>
                      <span className="dim">({rating(tr.id).n} đánh giá)</span>
                    </div>
                  </div>

                  <p className="muted mt8" style={{ lineHeight: 1.5 }}>
                    {tr.trainer?.bio || 'Huấn luyện viên tận tâm, kinh nghiệm xây dựng giáo án cá nhân hóa đạt chuẩn quốc tế.'}
                  </p>

                  <div className="row wrap small muted mt12" style={{ gap: 16 }}>
                    <span className="row" style={{ gap: 6 }}>
                      <Award size={15} color="var(--primary)" />
                      <b>{tr.trainer?.experienceYears} năm</b> kinh nghiệm
                    </span>
                    <span className="row" style={{ gap: 6 }}>
                      <CheckCircle2 size={15} color="#00d1b2" />
                      {tr.trainer?.certifications.join(', ')}
                    </span>
                    <span className="row" style={{ gap: 6 }}>
                      <MapPin size={15} color="#ff8fb0" />
                      {tr.trainer?.branchIds.map((b) => L.branchById(db, b)?.name.replace('DFGym ', '')).join(', ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* BỘ LỌC KHUNG GIỜ RẢNH & DANH SÁCH CA */}
            <div className="card">
              <div className="card-head between wrap" style={{ gap: 12 }}>
                <div>
                  <h2><CalendarDays size={18} /> Chọn khung giờ tập 1-kèm-1</h2>
                  <span className="small muted">
                    HLV có {rawSlots.length} ca tập được mở trong tuần này
                  </span>
                </div>

                {/* Bộ lọc buổi trong ngày: Sáng / Chiều / Tối */}
                <div className="chips">
                  <button
                    className={`chip ${timeOfDay === 'all' ? 'on' : ''}`}
                    onClick={() => setTimeOfDay('all')}
                  >
                    Tất cả ca
                  </button>
                  <button
                    className={`chip ${timeOfDay === 'morning' ? 'on' : ''}`}
                    onClick={() => setTimeOfDay('morning')}
                  >
                    <Sunrise size={13} style={{ marginRight: 4 }} /> Sáng (6h - 12h)
                  </button>
                  <button
                    className={`chip ${timeOfDay === 'afternoon' ? 'on' : ''}`}
                    onClick={() => setTimeOfDay('afternoon')}
                  >
                    <Sun size={13} style={{ marginRight: 4 }} /> Chiều (12h - 17h)
                  </button>
                  <button
                    className={`chip ${timeOfDay === 'evening' ? 'on' : ''}`}
                    onClick={() => setTimeOfDay('evening')}
                  >
                    <Sunset size={13} style={{ marginRight: 4 }} /> Tối (17h - 22h)
                  </button>
                </div>
              </div>

              {/* Lọc nhanh theo ngày có ca rảnh */}
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
                  <button
                    className="btn sm ghost mt12"
                    onClick={() => {
                      setTimeOfDay('all');
                      setSelectedDate('all');
                    }}
                  >
                    Hiển thị tất cả ca của HLV
                  </button>
                </div>
              ) : (
                <div className="col" style={{ gap: 18 }}>
                  {Object.entries(byDay).map(([d, list]) => (
                    <div key={d}>
                      <div className="row between mb8">
                        <span className="small bold" style={{ color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          📅 {fmtWeekday(d)}, {fmtDate(d)}
                        </span>
                        <span className="small dim">{list.length} ca tập</span>
                      </div>

                      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 10 }}>
                        {list.map((s) => {
                          const taken = L.slotTaken(db, s.id);
                          const isSel = slot === s.id;
                          const startMs = new Date(s.startAt).getTime();
                          const endMs = new Date(s.endAt).getTime();
                          const durMin = Math.round((endMs - startMs) / 60000);
                          const branch = L.branchById(db, s.branchId);

                          return (
                            <button
                              key={s.id}
                              className={`card hover ${isSel ? 'border-primary' : ''}`}
                              disabled={taken}
                              onClick={() => setSlot(s.id)}
                              style={{
                                padding: 12,
                                textAlign: 'left',
                                cursor: taken ? 'not-allowed' : 'pointer',
                                background: isSel
                                  ? 'rgba(0, 209, 178, 0.12)'
                                  : taken
                                  ? 'var(--surface-2)'
                                  : 'var(--surface)',
                                border: isSel
                                  ? '2px solid var(--primary)'
                                  : '1px solid var(--border)',
                                opacity: taken ? 0.45 : 1,
                                transition: 'all 0.15s ease',
                              }}
                              id={`slot-${s.id}`}
                            >
                              <div className="row between mb4">
                                <span style={{ fontWeight: 800, fontSize: 15, color: isSel ? 'var(--primary)' : 'var(--text)' }}>
                                  {fmtTime(s.startAt)} – {fmtTime(s.endAt)}
                                </span>
                                <Badge color={durMin === 90 ? 'purple' : durMin === 60 ? 'blue' : 'amber'} plain>
                                  {durMin}p
                                </Badge>
                              </div>

                              <div className="small dim truncate">
                                📍 {branch?.name.replace('DFGym ', '') || 'Chi nhánh'}
                              </div>

                              <div className="row between mt8 small">
                                {taken ? (
                                  <span style={{ color: 'var(--red)', fontWeight: 600 }}>Đã kín</span>
                                ) : isSel ? (
                                  <span style={{ color: 'var(--primary)', fontWeight: 700 }}>✓ Đang chọn</span>
                                ) : (
                                  <span style={{ color: '#00d1b2', fontWeight: 600 }}>Còn trống</span>
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

              {/* KHUNG XÁC NHẬN ĐẶT LỊCH */}
              {sel && (
                <div
                  className="card mt16"
                  style={{
                    background: 'rgba(0, 209, 178, 0.08)',
                    borderColor: 'rgba(0, 209, 178, 0.35)',
                    padding: 18,
                  }}
                >
                  <div className="row between wrap mb8" style={{ gap: 8 }}>
                    <div className="bold" style={{ fontSize: 16 }}>
                      Xác nhận: {fmtWeekday(sel.startAt)}, {fmtDateTime(sel.startAt)} ({Math.round((new Date(sel.endAt).getTime() - new Date(sel.startAt).getTime()) / 60000)} phút)
                    </div>
                    <Badge color="green">
                      {L.branchById(db, sel.branchId)?.name}
                    </Badge>
                  </div>

                  <div className="small muted mb12" style={{ lineHeight: 1.5 }}>
                    📌 Huấn luyện viên: <b>{tr.fullName}</b>. Sẽ trừ <b>1 buổi</b> (ưu tiên {bal.free > 0 ? 'buổi tặng kèm của gói hội viên' : 'từ gói PT cá nhân'}).
                    Hủy trước {db.settings.cancelDeadlineHours} giờ hoặc HLV từ chối lịch sẽ được hoàn lại 100% buổi tập.
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
                      style={{ minWidth: 140 }}
                    >
                      Xác nhận đặt lịch
                    </button>
                  </div>

                  {bal.total === 0 && (
                    <div className="small mt8" style={{ color: 'var(--red)', fontWeight: 600 }}>
                      ⚠️ Bạn đã hết số buổi PT (cả quà tặng và gói mua). Vui lòng đăng ký gói PT để đặt lịch.
                    </div>
                  )}
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
type Row = { id: string; kind: 'class' | 'pt'; at: string; end: string; title: string; sub: string; status: [string, string]; raw: string; canCancel: boolean; canReview: boolean; reviewed: boolean; source?: string };

export function MemberBookings() {
  const { db, user, act } = useApp();
  const [tab, setTab] = useState<'up' | 'past'>('up');
  const [review, setReview] = useState<Row | null>(null);
  const [cancel, setCancel] = useState<Row | null>(null);
  const uid = user!.id;
  const rows: Row[] = useMemo(() => {
    const now = Date.now();
    const cls: Row[] = db.classBookings.filter((b) => b.memberId === uid).map((b) => {
      const s = L.sessionById(db, b.sessionId)!;
      const c = L.classById(db, s.classId)!;
      return {
        id: b.id, kind: 'class', at: s.startAt, end: s.endAt, title: c.name, raw: b.status,
        sub: `${s.room} · ${L.branchById(db, c.branchId)?.name} · HLV ${L.userById(db, s.trainerId)?.fullName}`,
        status: cbLabel[b.status], canCancel: ['booked', 'waitlist'].includes(b.status) && new Date(s.startAt).getTime() > now,
        canReview: b.status === 'attended', reviewed: db.reviews.some((r) => r.bookingId === b.id),
      };
    });
    const pts: Row[] = db.ptBookings.filter((b) => b.memberId === uid).map((b) => ({
      id: b.id, kind: 'pt', at: b.startAt, end: b.endAt, title: `PT 1-kèm-1 · ${L.userById(db, b.trainerId)?.fullName}`, raw: b.status,
      sub: `${L.branchById(db, b.branchId)?.name}${b.note ? ' · ' + b.note : ''}`,
      status: ptbLabel[b.status], canCancel: ['pending', 'confirmed'].includes(b.status) && new Date(b.startAt).getTime() > now,
      canReview: b.status === 'completed', reviewed: db.reviews.some((r) => r.bookingId === b.id),
      source: b.source.type === 'membership_free' ? 'Buổi tặng kèm' : 'Gói PT',
    }));
    return [...cls, ...pts];
  }, [db, uid]);
  const active = ['booked', 'waitlist', 'pending', 'confirmed'];
  const up = rows.filter((r) => active.includes(r.raw) && new Date(r.end).getTime() > Date.now()).sort((a, b) => a.at.localeCompare(b.at));
  const past = rows.filter((r) => !up.includes(r)).sort((a, b) => b.at.localeCompare(a.at));
  const list = tab === 'up' ? up : past;
  const toReview = past.filter((r) => r.canReview && !r.reviewed).length;

  const doCancel = () => {
    if (!cancel) return;
    act((d) => (cancel.kind === 'class' ? L.cancelClassBooking(d, uid, cancel.id) : L.cancelPTByMember(d, uid, cancel.id)));
    setCancel(null);
  };

  return (
    <>
      <PageHead title="Lịch của tôi" desc="Quản lý lịch lớp nhóm và buổi PT, hủy lịch và đánh giá sau buổi tập." />
      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'up', label: 'Sắp tới', count: up.length }, { id: 'past', label: 'Lịch sử', count: toReview }]} />
      {list.length === 0 ? <div className="card"><Empty text={tab === 'up' ? 'Không có lịch sắp tới' : 'Chưa có lịch sử'} /></div> : (
        <div className="col">
          {list.map((r) => (
            <div className="list-item" key={r.id}>
              <div className="date-box" style={r.kind === 'pt' ? { background: 'rgba(0,209,178,.12)', borderColor: 'rgba(0,209,178,.35)' } : undefined}>
                <div className="d">{new Date(r.at).getDate()}</div>
                <div className="m">Th{new Date(r.at).getMonth() + 1}</div>
              </div>
              <div className="grow" style={{ minWidth: 0 }}>
                <div className="row wrap"><b>{r.title}</b><Badge color={r.kind === 'pt' ? 'blue' : 'purple'} plain>{r.kind === 'pt' ? 'PT' : 'Lớp nhóm'}</Badge>{r.source && <span className="small dim">· {r.source}</span>}</div>
                <div className="small muted">{fmtWeekday(r.at)} · {fmtTime(r.at)}–{fmtTime(r.end)} · {r.sub}</div>
              </div>
              <Badge color={r.status[1]}>{r.status[0]}</Badge>
              {r.canCancel && <button className="btn sm danger" onClick={() => setCancel(r)} id={`cancel-${r.id}`}><X size={14} /> Hủy</button>}
              {r.canReview && (r.reviewed ? <Badge color="amber" plain><Star size={12} /> Đã đánh giá</Badge> : <button className="btn sm primary" onClick={() => setReview(r)} id={`review-${r.id}`}><MessageSquare size={14} /> Đánh giá</button>)}
            </div>
          ))}
        </div>
      )}
      {cancel && (
        <ConfirmModal
          title="Hủy lịch"
          danger
          confirmText="Xác nhận hủy"
          message={
            <>
              Bạn muốn hủy <b>{cancel.title}</b> lúc {fmtDateTime(cancel.at)}?<br /><br />
              {cancel.raw === 'waitlist' || cancel.raw === 'pending' || hoursUntil(cancel.at) >= db.settings.cancelDeadlineHours
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
    <Modal title={`Đánh giá ${row.kind === 'pt' ? 'huấn luyện viên' : 'lớp học'}`} onClose={onClose} footer={<><button className="btn" onClick={onClose}>Để sau</button><button className="btn primary" onClick={submit} id="review-submit">Gửi đánh giá</button></>}>
      <div style={{ textAlign: 'center' }}>
        <h3>{row.title}</h3>
        <div className="small muted">{fmtDateTime(row.at)}</div>
        <div className="mt16"><Stars value={rating} onChange={setRating} size={34} /></div>
        <div className="small muted mt8">{['', 'Rất tệ', 'Chưa tốt', 'Bình thường', 'Tốt', 'Tuyệt vời!'][rating]}</div>
      </div>
      <div className="field mt16"><label>Nhận xét</label><textarea className="input" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Chia sẻ trải nghiệm của bạn..." id="review-comment" /></div>
    </Modal>
  );
}
