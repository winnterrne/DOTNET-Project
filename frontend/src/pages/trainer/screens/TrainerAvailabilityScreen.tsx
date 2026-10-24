import { useMemo, useState } from 'react';
import { Plus, Trash2, ArrowRight, ArrowLeft, Info, CheckCircle2, AlertTriangle, ShieldCheck, Settings } from 'lucide-react';
import { useApp } from '../../../store/AppContext';
import * as L from '../../../store/logic';
import { Badge, Modal, PageHead } from '../../../components/ui';
import { ptbLabel } from '../../../components/labels';
import { addDays, todayStr, fmtDate, fmtTime, fmtWeekday } from '../../../utils';
import { GYM_TIME_SLOTS, matchSlotId, getMondayStr, fullDayName, shortDayMonth } from '../../member/MemberBooking';

const QUICK_TIME_PRESETS = [
  { label: '07:00 (Sáng)', time: '07:00' },
  { label: '08:30 (Sáng)', time: '08:30' },
  { label: '10:00 (Sáng)', time: '10:00' },
  { label: '14:00 (Chiều)', time: '14:00' },
  { label: '15:30 (Chiều)', time: '15:30' },
  { label: '17:30 (Tối)', time: '17:30' },
  { label: '19:00 (Tối)', time: '19:00' },
];

export function TrainerAvailabilityScreen() {
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

      <div className="grid" style={{ gridTemplateColumns: '1.35fr 1fr', gap: 16, marginBottom: 18 }}>
        <div className="card">
          <div className="row between wrap mb12">
            <h3>1. Tạo Khung Giờ Rảnh Mới</h3>
            <span className="small muted">
              Khung giờ kết thúc dự kiến: <b className="mono">{liveRuleChecks.endTimeStr}</b>
            </span>
          </div>

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

export default TrainerAvailabilityScreen;
