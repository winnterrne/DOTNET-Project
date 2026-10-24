import { useState } from 'react';
import { Snowflake, Check, X } from 'lucide-react';
import { useApp } from '../../../store/AppContext';
import * as L from '../../../store/logic';
import { Avatar, Badge, Empty, PageHead, Tabs, ReasonModal } from '../../../components/ui';
import { reqLabel } from '../../../components/labels';
import { fmtDate, fmtDateTime } from '../../../utils';

export function StaffFreezeScreen() {
  const { db, user, act } = useApp();
  const [tab, setTab] = useState<'pending' | 'done'>('pending');
  const [reject, setReject] = useState<string | null>(null);
  const list = db.freezeRequests.filter((f) => (tab === 'pending' ? f.status === 'pending' : f.status !== 'pending'));

  return (
    <>
      <PageHead title="Yêu cầu tạm ngưng (freeze)" desc="Kiểm tra điều kiện gói và xử lý yêu cầu của hội viên." />
      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'pending', label: 'Chờ duyệt', count: db.freezeRequests.filter((f) => f.status === 'pending').length }, { id: 'done', label: 'Đã xử lý' }]} />
      {list.length === 0 ? <div className="card"><Empty text="Không có yêu cầu" icon={<Snowflake size={40} />} /></div> : (
        <div className="grid g2">
          {list.map((f) => {
            const m = L.userById(db, f.memberId);
            const ms = db.memberships.find((x) => x.id === f.membershipId)!;
            const p = L.planById(db, ms.planId)!;
            const affected = db.classBookings.filter((b) => b.memberId === f.memberId && ['booked', 'waitlist'].includes(b.status) && (() => { const s = L.sessionById(db, b.sessionId)!; return s.date >= f.startDate && s.date <= f.endDate; })()).length + db.ptBookings.filter((b) => b.memberId === f.memberId && ['pending', 'confirmed'].includes(b.status) && new Date(b.startAt).toLocaleDateString('sv-SE') >= f.startDate && new Date(b.startAt).toLocaleDateString('sv-SE') <= f.endDate).length;
            return (
              <div className="card" key={f.id}>
                <div className="row"><Avatar user={m} /><div className="grow"><b>{m?.fullName}</b><div className="small dim">{m?.phone} · gửi {fmtDateTime(f.createdAt)}</div></div><Badge color={reqLabel[f.status][1]}>{reqLabel[f.status][0]}</Badge></div>
                <div className="mt16">
                  <div className="kv"><span>Gói</span><span>{p.name} (HSD {fmtDate(ms.endDate)})</span></div>
                  <div className="kv"><span>Khoảng tạm ngưng</span><span>{fmtDate(f.startDate)} → {fmtDate(f.endDate)} ({f.days} ngày)</span></div>
                  <div className="kv"><span>Đã dùng</span><span>{ms.freezeCountUsed}/{p.maxFreezeTimes} lần · {ms.freezeDaysUsed}/{p.maxFreezeDays} ngày</span></div>
                  {f.status === 'pending' && <div className="kv"><span>Lịch bị ảnh hưởng</span><span style={{ color: affected ? '#ffc857' : undefined }}>{affected} lịch sẽ tự hủy</span></div>}
                  <div className="kv"><span>Lý do</span><span>{f.reason}</span></div>
                  {f.status !== 'pending' && <div className="kv"><span>Xử lý bởi</span><span>{L.userById(db, f.handledBy)?.fullName} · {fmtDateTime(f.handledAt)}{f.note ? ` · ${f.note}` : ''}</span></div>}
                </div>
                {f.status === 'pending' && (
                  <div className="row mt16" style={{ justifyContent: 'flex-end' }}>
                    <button className="btn danger sm" onClick={() => setReject(f.id)}><X size={14} /> Từ chối</button>
                    <button className="btn success sm" onClick={() => act((d) => L.handleFreeze(d, f.id, user!.id, true, ''), 'Đã duyệt – hạn gói được cộng thêm ' + f.days + ' ngày')} id={`approve-${f.id}`}><Check size={14} /> Duyệt</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {reject && <ReasonModal title="Từ chối yêu cầu freeze" label="Lý do" confirmText="Từ chối" danger required onClose={() => setReject(null)} onConfirm={(r) => { act((d) => L.handleFreeze(d, reject, user!.id, false, r), 'Đã từ chối yêu cầu'); setReject(null); }} />}
    </>
  );
}

export default StaffFreezeScreen;
