import { Link } from 'react-router-dom';
import { ScanLine, LogIn, Users, Snowflake, Wrench } from 'lucide-react';
import { useApp } from '../../../store/AppContext';
import * as L from '../../../store/logic';
import { Avatar, Badge, Empty, PageHead, StatCard } from '../../../components/ui';
import { fmtTime, todayStr } from '../../../utils';

export function StaffHomeScreen() {
  const { db, user } = useApp();
  const br = user!.branchId!;
  const today = todayStr();
  const todayCI = db.checkins.filter((c) => c.branchId === br && c.checkInAt.slice(0, 10) <= today && new Date(c.checkInAt).toLocaleDateString('sv-SE') === today);
  const present = db.checkins.filter((c) => c.branchId === br && c.result === 'success' && !c.checkOutAt);
  const freezes = db.freezeRequests.filter((f) => f.status === 'pending');
  const reports = db.equipmentReports.filter((r) => r.branchId === br && ['pending', 'in_progress'].includes(r.status));
  const sessionsToday = db.sessions.filter((s) => s.date === today && L.classById(db, s.classId)?.branchId === br).sort((a, b) => a.startAt.localeCompare(b.startAt));

  return (
    <>
      <PageHead
        title={`Quầy lễ tân · ${L.branchById(db, br)?.name}`}
        desc="Tổng quan vận hành trong ngày."
        actions={<Link to="/staff/checkin" className="btn primary"><ScanLine size={16} /> Check-in / out</Link>}
      />
      <div className="grid g4 mb16">
        <StatCard icon={<Users size={22} />} label="Đang có mặt" value={<span className="row"><span className="live-dot" /> {present.length}</span>} color="#2ed47a" />
        <StatCard icon={<LogIn size={22} />} label="Lượt check-in hôm nay" value={todayCI.filter((c) => c.result === 'success').length} color="#7c5cff" sub={`${todayCI.filter((c) => c.result === 'denied').length} lượt bị từ chối`} />
        <StatCard icon={<Snowflake size={22} />} label="Yêu cầu freeze chờ duyệt" value={freezes.length} color="#3fa9ff" />
        <StatCard icon={<Wrench size={22} />} label="Sự cố thiết bị đang mở" value={reports.length} color="#ff5c8a" />
      </div>
      <div className="grid g2">
        <div className="card">
          <div className="card-head"><h2><Users size={18} /> Hội viên đang tập</h2></div>
          {present.length === 0 ? <Empty text="Chưa có ai trong phòng tập" /> : (
            <div className="col">
              {present.map((c) => {
                const m = L.userById(db, c.memberId);
                return (
                  <div className="list-item" key={c.id}>
                    <Avatar user={m} size="sm" />
                    <div className="grow">
                      <b>{m?.fullName}</b>
                      <div className="small dim">{m?.cardCode} · vào lúc {fmtTime(c.checkInAt)}</div>
                    </div>
                    {c.method === 'manual' && <Badge color="amber" plain>Thủ công</Badge>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="card">
          <div className="card-head"><h2>Lớp học hôm nay</h2></div>
          {sessionsToday.length === 0 ? <Empty text="Không có lớp hôm nay" /> : (
            <div className="col">
              {sessionsToday.map((s) => {
                const c = L.classById(db, s.classId)!;
                return (
                  <div className="list-item" key={s.id}>
                    <div className="date-box" style={{ background: c.color + '22', borderColor: c.color + '66' }}>
                      <div className="d" style={{ fontSize: 15 }}>{fmtTime(s.startAt)}</div>
                    </div>
                    <div className="grow">
                      <b>{c.name}</b>
                      <div className="small dim">{s.room} · HLV {L.userById(db, s.trainerId)?.fullName}</div>
                    </div>
                    <Badge color={s.status === 'cancelled' ? 'red' : 'gray'}>
                      {s.status === 'cancelled' ? 'Đã hủy' : `${L.bookedCount(db, s.id)}/${c.capacity}`}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default StaffHomeScreen;
