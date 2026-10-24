import { useApp } from '../../../store/AppContext';
import * as L from '../../../store/logic';
import { Avatar, Empty, PageHead, Stars } from '../../../components/ui';
import { fmtDate } from '../../../utils';
import { useTrainerStats } from './useTrainerStats';

export function TrainerReviewsScreen() {
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

export default TrainerReviewsScreen;
