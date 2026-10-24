import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { useApp } from '../../../store/AppContext';
import * as L from '../../../store/logic';
import { Avatar, Badge, Empty, PageHead, Tabs, ReasonModal } from '../../../components/ui';
import { ptbLabel } from '../../../components/labels';
import { fmtDateTime, fmtTime, fmtWeekday } from '../../../utils';

export function TrainerRequestsScreen() {
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

export default TrainerRequestsScreen;
