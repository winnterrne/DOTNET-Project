import { useState } from 'react';
import { CalendarDays, MapPin, ClipboardCheck } from 'lucide-react';
import { useApp } from '../../../store/AppContext';
import * as L from '../../../store/logic';
import { Avatar, Badge, Empty, Modal, PageHead, Tabs } from '../../../components/ui';
import { cbLabel } from '../../../components/labels';
import { fmtDateTime, fmtWeekday } from '../../../utils';
import { useTrainerStats } from './useTrainerStats';

export function TrainerClassesScreen() {
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

export default TrainerClassesScreen;
