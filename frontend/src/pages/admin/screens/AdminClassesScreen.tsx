import { useState } from 'react';
import { Plus, Edit2, Trash2, CalendarDays } from 'lucide-react';
import { useApp } from '../../../store/AppContext';
import * as L from '../../../store/logic';
import { Badge, Modal, PageHead } from '../../../components/ui';
import { fmtDateTime, fmtTime, WEEKDAYS, uid } from '../../../utils';
import type { GroupClass } from '../../../types';

export function AdminClassesScreen() {
  const { db, act } = useApp();
  const [classModal, setClassModal] = useState<GroupClass | 'new' | null>(null);
  const [rescheduleSessionId, setRescheduleSessionId] = useState<string | null>(null);
  const [cancelSessionId, setCancelSessionId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const now = Date.now();
  const upcomingSessions = db.sessions
    .filter((s) => s.status === 'scheduled' && new Date(s.startAt).getTime() > now)
    .sort((a, b) => a.startAt.localeCompare(b.startAt));

  const handleDeleteClass = (cId: string) => {
    if (confirm('Bạn có chắc muốn ngừng hoạt động lớp này? Các buổi tương lai chưa diễn ra sẽ tự động bị hủy và hoàn lượt cho học viên.')) {
      act((d) => L.deleteClass(d, cId), 'Đã ngừng hoạt động lớp học');
    }
  };

  const handleConfirmCancelSession = () => {
    if (!cancelSessionId) return;
    act((d) => L.cancelSession(d, cancelSessionId, cancelReason || 'HLV bận đột xuất / Sự cố phòng tập'), 'Đã hủy buổi học và gửi thông báo hoàn lượt');
    setCancelSessionId(null);
    setCancelReason('');
  };

  return (
    <>
      <PageHead
        title="Quản lý Lớp học Nhóm"
        desc="Tạo và quản lý các lớp học nhóm, phân công HLV phụ trách, phòng tập và lịch lặp lại. Hủy hoặc đổi lịch từng buổi cụ thể."
        actions={
          <button className="btn primary" onClick={() => setClassModal('new')} id="btn-add-class">
            <Plus size={16} /> Tạo lớp học mới
          </button>
        }
      />

      <div className="card-head mt24">
        <h2>Danh mục lớp học ({db.classes.filter((c) => c.active).length})</h2>
      </div>

      <div className="grid g3 mb24">
        {db.classes.filter((c) => c.active).map((c) => {
          const trainer = L.userById(db, c.trainerId);
          const branch = L.branchById(db, c.branchId);
          return (
            <div className="card hover" key={c.id} style={{ borderLeft: `4px solid ${c.color}` }}>
              <div className="card-head">
                <div>
                  <Badge color="purple" plain>{c.category}</Badge>
                  <h2 className="mt8">{c.name}</h2>
                </div>
                <div className="row" style={{ gap: 6 }}>
                  <button className="btn sm ghost" onClick={() => setClassModal(c)} id={`edit-class-${c.id}`}>
                    <Edit2 size={14} /> Sửa
                  </button>
                  <button className="btn sm danger" onClick={() => handleDeleteClass(c.id)} id={`del-class-${c.id}`}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="small muted">{c.description}</div>
              <div className="divider" />

              <div className="col small" style={{ gap: 6 }}>
                <div><b>HLV phụ trách:</b> {trainer?.fullName || 'Chưa gán'}</div>
                <div><b>Địa điểm:</b> {c.room} · {branch?.name}</div>
                <div><b>Khung giờ:</b> {c.startTime} ({c.durationMin} phút)</div>
                <div><b>Lịch lặp lại:</b> {c.daysOfWeek.map((d) => WEEKDAYS[d]).join(', ')}</div>
                <div><b>Sĩ số tối đa:</b> {c.capacity} học viên</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="card-head">
          <h2><CalendarDays size={18} /> Các buổi học sắp diễn ra & Đổi/Hủy lịch</h2>
          <span className="small muted">{upcomingSessions.length} buổi học tương lai</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Lớp học</th>
                <th>Thời gian</th>
                <th>Chi nhánh & Phòng</th>
                <th>Huấn luyện viên</th>
                <th>Đã đăng ký / Chờ</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {upcomingSessions.slice(0, 15).map((s) => {
                const c = L.classById(db, s.classId)!;
                const tr = L.userById(db, s.trainerId);
                const booked = L.bookedCount(db, s.id);
                const wl = L.waitlistOf(db, s.id).length;
                return (
                  <tr key={s.id}>
                    <td>
                      <div className="row">
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: c?.color }} />
                        <b>{c?.name}</b>
                      </div>
                    </td>
                    <td>{fmtDateTime(s.startAt)}</td>
                    <td className="small">{L.branchById(db, c?.branchId)?.name} ({s.room})</td>
                    <td className="small">{tr?.fullName}</td>
                    <td>
                      <Badge color={c && booked >= c.capacity ? 'amber' : 'green'}>
                        {booked}/{c?.capacity}
                      </Badge>
                      {wl > 0 && <span className="small dim" style={{ marginLeft: 6 }}>+{wl} chờ</span>}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="row" style={{ justifyContent: 'flex-end', gap: 6 }}>
                        <button
                          className="btn sm"
                          onClick={() => setRescheduleSessionId(s.id)}
                          id={`reschedule-${s.id}`}
                        >
                          Đổi lịch
                        </button>
                        <button
                          className="btn sm danger"
                          onClick={() => setCancelSessionId(s.id)}
                          id={`cancel-session-${s.id}`}
                        >
                          Hủy buổi
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {classModal && (
        <ClassFormModal
          cls={classModal === 'new' ? null : classModal}
          onClose={() => setClassModal(null)}
        />
      )}

      {rescheduleSessionId && (
        <RescheduleSessionModal
          sessionId={rescheduleSessionId}
          onClose={() => setRescheduleSessionId(null)}
        />
      )}

      {cancelSessionId && (
        <Modal
          title="Hủy buổi học cụ thể"
          onClose={() => setCancelSessionId(null)}
          footer={
            <>
              <button className="btn" onClick={() => setCancelSessionId(null)}>Quay lại</button>
              <button className="btn danger" onClick={handleConfirmCancelSession} id="confirm-cancel-session">
                Xác nhận hủy
              </button>
            </>
          }
        >
          <p className="muted mb16">
            Hủy buổi học sẽ tự động hủy các lịch đặt của hội viên, hoàn trả lượt đặt và gửi thông báo đến các bên liên quan.
          </p>
          <div className="field">
            <label>Lý do hủy buổi học</label>
            <input
              className="input"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="VD: Phòng tập bảo trì điện nước đột xuất"
              id="cancel-reason"
            />
          </div>
        </Modal>
      )}
    </>
  );
}

function ClassFormModal({ cls, onClose }: { cls: GroupClass | null; onClose: () => void }) {
  const { db, act } = useApp();
  const trainers = db.users.filter((u) => u.role === 'trainer' && !u.locked);

  const [name, setName] = useState(cls?.name || '');
  const [category, setCategory] = useState(cls?.category || 'Yoga');
  const [description, setDescription] = useState(cls?.description || '');
  const [trainerId, setTrainerId] = useState(cls?.trainerId || trainers[0]?.id || '');
  const [branchId, setBranchId] = useState(cls?.branchId || db.branches[0]?.id || '');
  const [room, setRoom] = useState(cls?.room || 'Phòng Yoga');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(cls?.daysOfWeek || [1, 3, 5]);
  const [startTime, setStartTime] = useState(cls?.startTime || '07:00');
  const [durationMin, setDurationMin] = useState(cls?.durationMin || 60);
  const [capacity, setCapacity] = useState(cls?.capacity || 15);
  const [color, setColor] = useState(cls?.color || '#2ed47a');

  const selectedBranch = db.branches.find((b) => b.id === branchId) || db.branches[0];

  const handleSave = () => {
    act((d) => {
      if (!name.trim()) throw new Error('Vui lòng nhập tên lớp');
      if (daysOfWeek.length === 0) throw new Error('Vui lòng chọn ít nhất một ngày trong tuần');
      const data: GroupClass = {
        id: cls ? cls.id : uid('cl'),
        name: name.trim(),
        category: category.trim(),
        description: description.trim(),
        trainerId,
        branchId,
        room,
        daysOfWeek,
        startTime,
        durationMin,
        capacity,
        color,
        active: true,
      };
      L.saveClass(d, data);
    }, cls ? 'Đã cập nhật thông tin lớp học' : 'Đã tạo lớp học mới và sinh lịch');
    onClose();
  };

  return (
    <Modal
      wide
      title={cls ? `Chỉnh sửa lớp: ${cls.name}` : 'Tạo lớp học nhóm mới'}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Hủy</button>
          <button className="btn primary" onClick={handleSave} id="save-class">Lưu lớp học</button>
        </>
      }
    >
      <div className="form-grid">
        <div className="field">
          <label>Tên lớp học *</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Yoga Flow Sáng" id="class-name" />
        </div>
        <div className="field">
          <label>Thể loại *</label>
          <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Yoga, Cardio, HIIT, Boxing..." />
        </div>
        <div className="field">
          <label>Chi nhánh mở lớp *</label>
          <select className="input" value={branchId} onChange={(e) => { setBranchId(e.target.value); setRoom(db.branches.find((b) => b.id === e.target.value)?.rooms[0] || ''); }}>
            {db.branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Phòng tập *</label>
          <select className="input" value={room} onChange={(e) => setRoom(e.target.value)}>
            {selectedBranch?.rooms.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Huấn luyện viên phụ trách *</label>
          <select className="input" value={trainerId} onChange={(e) => setTrainerId(e.target.value)}>
            {trainers.map((t) => (
              <option key={t.id} value={t.id}>{t.fullName}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Giờ bắt đầu *</label>
          <input type="time" className="input" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>
        <div className="field">
          <label>Thời lượng (phút) *</label>
          <input type="number" min={15} step={15} className="input" value={durationMin} onChange={(e) => setDurationMin(+e.target.value)} />
        </div>
        <div className="field">
          <label>Sĩ số tối đa *</label>
          <input type="number" min={1} className="input" value={capacity} onChange={(e) => setCapacity(+e.target.value)} />
        </div>
        <div className="field full">
          <label>Các ngày lặp lại trong tuần *</label>
          <div className="chips">
            {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
              const sel = daysOfWeek.includes(dayIndex);
              return (
                <button
                  key={dayIndex}
                  className={`chip ${sel ? 'on' : ''}`}
                  onClick={() => setDaysOfWeek(sel ? daysOfWeek.filter((x) => x !== dayIndex) : [...daysOfWeek, dayIndex])}
                >
                  {WEEKDAYS[dayIndex]}
                </button>
              );
            })}
          </div>
        </div>
        <div className="field full">
          <label>Màu hiển thị trên lịch</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: 80, height: 38, border: 'none', background: 'transparent', cursor: 'pointer' }} />
        </div>
        <div className="field full">
          <label>Mô tả lớp học</label>
          <textarea className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả nội dung bài tập, đối tượng phù hợp..." />
        </div>
      </div>
    </Modal>
  );
}

function RescheduleSessionModal({ sessionId, onClose }: { sessionId: string; onClose: () => void }) {
  const { db, act } = useApp();
  const s = L.sessionById(db, sessionId)!;
  const c = L.classById(db, s.classId)!;
  const branch = L.branchById(db, c.branchId);
  const trainers = db.users.filter((u) => u.role === 'trainer' && !u.locked);

  const [date, setDate] = useState(s.date);
  const [time, setTime] = useState(fmtTime(s.startAt));
  const [room, setRoom] = useState(s.room);
  const [trainerId, setTrainerId] = useState(s.trainerId);

  const handleSave = () => {
    act((d) => {
      L.rescheduleSession(d, sessionId, date, time, room, trainerId);
    }, 'Đã cập nhật lịch buổi học và gửi thông báo cho các bên');
    onClose();
  };

  return (
    <Modal
      title={`Đổi lịch: ${c.name}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Hủy</button>
          <button className="btn primary" onClick={handleSave} id="save-reschedule">Xác nhận đổi lịch</button>
        </>
      }
    >
      <div className="form-grid">
        <div className="field">
          <label>Ngày học mới *</label>
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field">
          <label>Giờ bắt đầu mới *</label>
          <input type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <div className="field">
          <label>Phòng tập</label>
          <select className="input" value={room} onChange={(e) => setRoom(e.target.value)}>
            {branch?.rooms.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Huấn luyện viên phụ trách</label>
          <select className="input" value={trainerId} onChange={(e) => setTrainerId(e.target.value)}>
            {trainers.map((t) => (
              <option key={t.id} value={t.id}>{t.fullName}</option>
            ))}
          </select>
        </div>
      </div>
      <p className="small muted mt16">💡 Hệ thống sẽ tự động gửi thông báo đến tất cả học viên đã đăng ký về sự thay đổi lịch học này.</p>
    </Modal>
  );
}

export default AdminClassesScreen;
