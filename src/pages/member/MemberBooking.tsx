import { useMemo, useState } from 'react';
import { CalendarDays, Users, Clock, MapPin, ChevronLeft, ChevronRight, Dumbbell, Star, Award, Gift, MessageSquare, X, ListOrdered } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import * as L from '../../store/logic';
import { Avatar, Badge, Empty, Modal, PageHead, Stars, Tabs, ConfirmModal, Progress } from '../../components/ui';
import { cbLabel, ptbLabel } from '../../components/labels';
import { addDays, todayStr, fmtTime, fmtDate, WEEKDAYS, parseDate, fmtDateTime, hoursUntil, fmtWeekday } from '../../utils';
import type { ClassSession } from '../../types';

/* ================= Lớp học nhóm ================= */
export function MemberClasses() {
  const { db, user, act } = useApp();
  const [offset, setOffset] = useState(0);
  const [branch, setBranch] = useState<string>('all');
  const [cat, setCat] = useState<string>('all');
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
      return c && (branch === 'all' || c.branchId === branch) && (cat === 'all' || c.category === cat);
    })
    .sort((a, b) => a.startAt.localeCompare(b.startAt));

  const myBooking = (sid: string) => db.classBookings.find((b) => b.sessionId === sid && b.memberId === user!.id && ['booked', 'waitlist', 'attended'].includes(b.status));

  return (
    <>
      <PageHead
        title="Lớp học nhóm"
        desc={plan ? <>Gói <b>{plan.name}</b> · {plan.classBookingsPerWeek ? `${plan.classBookingsPerWeek} lượt/tuần` : 'Không giới hạn lượt'} · Ưu tiên waitlist cấp {plan.priority} · {L.scopeLabel(db, plan.branchScope)}</> : 'Bạn cần gói hội viên còn hiệu lực để đặt lớp.'}
        actions={
          <>
            <button className="icon-btn" onClick={() => setOffset(Math.max(0, offset - 7))} disabled={offset === 0}><ChevronLeft size={18} /></button>
            <span className="bold">{fmtDate(days[0])} – {fmtDate(days[6])}</span>
            <button className="icon-btn" onClick={() => setOffset(Math.min(7, offset + 7))} disabled={offset >= 7}><ChevronRight size={18} /></button>
          </>
        }
      />
      <div className="row wrap mb16" style={{ gap: 16 }}>
        <div className="chips">
          <button className={`chip ${branch === 'all' ? 'on' : ''}`} onClick={() => setBranch('all')}>Tất cả chi nhánh</button>
          {db.branches.map((b) => <button key={b.id} className={`chip ${branch === b.id ? 'on' : ''}`} onClick={() => setBranch(b.id)}>{b.name.replace('DFGym ', '')}</button>)}
        </div>
        <div className="chips">
          <button className={`chip ${cat === 'all' ? 'on' : ''}`} onClick={() => setCat('all')}>Mọi bộ môn</button>
          {cats.map((c) => <button key={c} className={`chip ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>{c}</button>)}
        </div>
      </div>
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
                    <div key={s.id} className={`session-card ${mine ? 'mine' : ''} ${s.status === 'cancelled' ? 'cancelled' : ''}`} style={{ ['--c' as string]: c.color, opacity: past && s.status !== 'cancelled' ? 0.5 : undefined }} onClick={() => setSel(s)} id={`session-${s.id}`}>
                      <div className="small" style={{ color: c.color, fontWeight: 700 }}>{fmtTime(s.startAt)}</div>
                      <div className="bold" style={{ fontSize: 13.5 }}>{c.name}</div>
                      <div className="small dim">{L.branchById(db, c.branchId)?.name.replace('DFGym ', '')}</div>
                      <div className="row between mt8">
                        <span className="small" style={{ color: cnt >= c.capacity ? '#ff8aa0' : 'var(--text-2)' }}><Users size={12} /> {cnt}/{c.capacity}</span>
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
  const trainers = db.users.filter((u) => u.role === 'trainer' && !u.locked);
  const [tid, setTid] = useState(trainers[0]?.id);
  const [slot, setSlot] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const bal = L.ptBalance(db, user!.id);
  const tr = L.userById(db, tid);
  const now = Date.now();
  const slots = db.trainerSlots.filter((s) => s.trainerId === tid && new Date(s.startAt).getTime() > now).sort((a, b) => a.startAt.localeCompare(b.startAt));
  const byDay = slots.reduce<Record<string, typeof slots>>((acc, s) => {
    const d = s.startAt.slice(0, 10) && new Date(s.startAt).toDateString();
    (acc[d] ||= []).push(s);
    return acc;
  }, {});
  const rating = (id: string) => {
    const rs = db.reviews.filter((r) => r.trainerId === id);
    return { avg: rs.length ? rs.reduce((a, r) => a + r.rating, 0) / rs.length : 0, n: rs.length };
  };
  const book = () => {
    if (!slot) return;
    const r = act((d) => L.bookPT(d, user!.id, slot, note), 'Đã gửi yêu cầu đặt lịch, chờ HLV xác nhận');
    if (r) { setSlot(null); setNote(''); }
  };
  const sel = slots.find((s) => s.id === slot);
  return (
    <>
      <PageHead
        title="Đặt lịch PT 1-kèm-1"
        desc="Chọn huấn luyện viên và khung giờ rảnh. Mỗi lần đặt trừ 1 buổi (ưu tiên buổi tặng kèm của gói hội viên)."
        actions={
          <div className="card row" style={{ padding: '10px 16px', gap: 16 }}>
            <span className="row small"><Gift size={15} color="#ff8fb0" /> Tặng kèm: <b>{bal.free}</b></span>
            <span className="row small"><Dumbbell size={15} color="#00d1b2" /> Gói PT: <b>{bal.pkg}</b></span>
          </div>
        }
      />
      <div className="grid" style={{ gridTemplateColumns: 'minmax(260px, 340px) 1fr', gap: 18 }}>
        <div className="col">
          {trainers.map((t) => {
            const r = rating(t.id);
            return (
              <div key={t.id} className="list-item" style={{ cursor: 'pointer', borderColor: t.id === tid ? 'var(--primary)' : undefined, background: t.id === tid ? 'rgba(124,92,255,.1)' : undefined }} onClick={() => { setTid(t.id); setSlot(null); }} id={`trainer-${t.id}`}>
                <Avatar user={t} />
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="bold">{t.fullName}</div>
                  <div className="small dim">{t.trainer?.specialties.join(' · ')}</div>
                  <div className="row small" style={{ gap: 6 }}><Stars value={r.avg} size={12} /> <span className="dim">{r.avg ? r.avg.toFixed(1) : '—'} ({r.n})</span></div>
                </div>
              </div>
            );
          })}
        </div>
        {tr && (
          <div className="col" style={{ gap: 18 }}>
            <div className="card">
              <div className="row" style={{ gap: 16, alignItems: 'flex-start' }}>
                <Avatar user={tr} size="lg" />
                <div className="grow">
                  <h2>{tr.fullName}</h2>
                  <div className="row wrap mt8">{tr.trainer?.specialties.map((s) => <Badge key={s} color="purple" plain>{s}</Badge>)}</div>
                  <p className="muted mt8">{tr.trainer?.bio}</p>
                  <div className="row wrap small muted mt8" style={{ gap: 16 }}>
                    <span className="row"><Award size={14} /> {tr.trainer?.experienceYears} năm kinh nghiệm</span>
                    <span>{tr.trainer?.certifications.join(', ')}</span>
                    <span className="row"><MapPin size={14} /> {tr.trainer?.branchIds.map((b) => L.branchById(db, b)?.name.replace('DFGym ', '')).join(', ')}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-head"><h2><CalendarDays size={18} /> Khung giờ rảnh</h2><span className="small muted">{slots.length} khung giờ</span></div>
              {slots.length === 0 ? <Empty text="HLV chưa cập nhật lịch rảnh" /> : (
                <div className="col" style={{ gap: 16 }}>
                  {Object.entries(byDay).map(([d, list]) => (
                    <div key={d}>
                      <div className="small bold muted mb16" style={{ marginBottom: 8 }}>{fmtWeekday(list[0].startAt)}, {fmtDate(list[0].startAt)}</div>
                      <div className="row wrap">
                        {list.map((s) => {
                          const taken = L.slotTaken(db, s.id);
                          return (
                            <button key={s.id} className={`slot-btn ${slot === s.id ? 'on' : ''}`} disabled={taken} onClick={() => setSlot(s.id)} style={{ minWidth: 120 }} id={`slot-${s.id}`}>
                              {fmtTime(s.startAt)} – {fmtTime(s.endAt)}
                              <div className="small dim" style={{ fontWeight: 400 }}>{L.branchById(db, s.branchId)?.name.replace('DFGym ', '')}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {sel && (
                <div className="card mt16" style={{ background: 'rgba(0,209,178,.07)', borderColor: 'rgba(0,209,178,.3)' }}>
                  <div className="bold">Xác nhận: {fmtWeekday(sel.startAt)} {fmtDateTime(sel.startAt)} tại {L.branchById(db, sel.branchId)?.name}</div>
                  <div className="small muted mt8">Sẽ trừ 1 {bal.free > 0 ? 'buổi tặng kèm của gói hội viên' : 'buổi từ gói PT (gói hết hạn sớm nhất)'}. Hủy trước {db.settings.cancelDeadlineHours}h hoặc HLV từ chối sẽ được hoàn buổi.</div>
                  <div className="row mt16">
                    <input className="input grow" placeholder="Ghi chú cho HLV (mục tiêu, nhóm cơ...)" value={note} onChange={(e) => setNote(e.target.value)} id="pt-note" />
                    <button className="btn primary" onClick={book} disabled={bal.total === 0} id="pt-book">Gửi yêu cầu</button>
                  </div>
                  {bal.total === 0 && <div className="small mt8" style={{ color: '#ff8aa0' }}>Bạn đã hết buổi PT – hãy mua gói PT 1-kèm-1.</div>}
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
