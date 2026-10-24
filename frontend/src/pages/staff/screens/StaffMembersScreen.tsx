import { useState } from 'react';
import { Search } from 'lucide-react';
import { useApp } from '../../../store/AppContext';
import * as L from '../../../store/logic';
import { Avatar, Badge, PageHead } from '../../../components/ui';
import { mStatusLabel } from '../../../components/labels';
import { fmtDate } from '../../../utils';

export function StaffMembersScreen() {
  const { db } = useApp();
  const [q, setQ] = useState('');
  const term = q.trim().toLowerCase();
  const list = db.users.filter(
    (u) =>
      u.role === 'member' &&
      (!term ||
        u.fullName.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.phone.includes(term) ||
        u.cardCode?.toLowerCase().includes(term)),
  );

  return (
    <>
      <PageHead title="Tra cứu hội viên" desc="Kiểm tra nhanh hiệu lực gói và trạng thái (tìm theo tên, SĐT, email, mã thẻ)." />
      <div className="input-icon mb16" style={{ maxWidth: 420 }}>
        <Search size={17} />
        <input className="input" placeholder="Tên, SĐT, email, mã thẻ..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Hội viên</th>
              <th>Mã thẻ</th>
              <th>SĐT / Email</th>
              <th>Gói hiện tại</th>
              <th>Hiệu lực</th>
              <th>Buổi PT</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {list.map((u) => {
              const ms = L.membershipOn(db, u.id);
              const latest = L.latestPaidMembership(db, u.id);
              const st = ms ? L.membershipStatus(db, ms) : latest ? L.membershipStatus(db, latest) : null;
              const bal = L.ptBalance(db, u.id);
              return (
                <tr key={u.id}>
                  <td>
                    <div className="row">
                      <Avatar user={u} size="sm" />
                      <b>{u.fullName}</b>
                      {u.locked && <Badge color="red">Khóa</Badge>}
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace' }}>{u.cardCode}</td>
                  <td className="small">
                    <div>{u.phone}</div>
                    <div className="dim">{u.email}</div>
                  </td>
                  <td>{ms ? L.planById(db, ms.planId)?.name : '—'}</td>
                  <td className="small">{latest ? `${fmtDate(latest.startDate)} → ${fmtDate(latest.endDate)}` : '—'}</td>
                  <td>{bal.total}</td>
                  <td>{st ? <Badge color={mStatusLabel[st][1]}>{mStatusLabel[st][0]}</Badge> : <Badge>Chưa mua</Badge>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default StaffMembersScreen;
