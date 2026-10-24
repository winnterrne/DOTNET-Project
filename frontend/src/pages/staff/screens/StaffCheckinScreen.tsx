import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ScanLine, LogIn, LogOut, CheckCircle2, XCircle, Search, Keyboard, Download, Zap, ArrowLeft, History } from 'lucide-react';
import { useApp } from '../../../store/AppContext';
import * as L from '../../../store/logic';
import { Avatar, Badge, Empty, PageHead, Tabs } from '../../../components/ui';
import { mStatusLabel } from '../../../components/labels';
import { fmtDate, fmtDateTime, fmtTime } from '../../../utils';
import type { CheckIn } from '../../../types';

type Result = { ok: boolean; title: string; record?: CheckIn; memberId?: string; msg?: string };

export function ResultPanel({ r }: { r: Result }) {
  const { db } = useApp();
  const m = L.userById(db, r.memberId);
  const ms = m ? L.membershipOn(db, m.id) : undefined;
  const plan = ms ? L.planById(db, ms.planId) : undefined;
  return (
    <div className={`result-panel ${r.ok ? 'ok' : 'no'}`}>
      <div className="row">
        {r.ok ? <CheckCircle2 size={34} color="#2ed47a" /> : <XCircle size={34} color="#ff4d6d" />}
        <div>
          <h2>{r.title}</h2>
          {r.msg && <div className="muted">{r.msg}</div>}
        </div>
      </div>
      {m && (
        <div className="row mt16">
          <Avatar user={m} />
          <div className="grow">
            <b>{m.fullName}</b>
            <div className="small muted">{m.cardCode} · {plan ? `${plan.name} · HSD ${fmtDate(ms!.endDate)}` : 'Không có gói hiệu lực'}</div>
          </div>
          {ms && <Badge color={mStatusLabel[L.membershipStatus(db, ms)][1]}>{mStatusLabel[L.membershipStatus(db, ms)][0]}</Badge>}
        </div>
      )}
    </div>
  );
}

export function Scanner({ branchId, staffId }: { branchId: string; staffId?: string }) {
  const { db, act } = useApp();
  const [code, setCode] = useState('');
  const [res, setRes] = useState<Result | null>(null);
  const members = db.users.filter((u) => u.role === 'member').slice(0, 10);
  const run = (mode: 'in' | 'out', c = code) => {
    if (!c.trim()) return;
    if (mode === 'in') {
      const r = act((d) => L.checkIn(d, { code: c, branchId, method: 'card' }));
      if (r) setRes(r.record.result === 'success' ? { ok: true, title: 'Check-in thành công', memberId: r.member.id, msg: 'Chào mừng bạn đến tập!', record: r.record } : { ok: false, title: 'Từ chối check-in', memberId: r.member.id, msg: r.record.denyReason });
      else setRes({ ok: false, title: 'Không nhận diện được thẻ' });
    } else {
      const r = act((d) => L.checkOut(d, { code: c, method: 'card', staffId }));
      if (r) {
        const mins = Math.round((new Date(r.record.checkOutAt!).getTime() - new Date(r.record.checkInAt).getTime()) / 60000);
        setRes({ ok: true, title: 'Check-out thành công', memberId: r.member.id, msg: `Thời lượng tập: ${Math.floor(mins / 60)}h${String(mins % 60).padStart(2, '0')}p. Hẹn gặp lại!` });
      }
    }
    setCode('');
  };
  return (
    <div className="grid g2">
      <div>
        <div className="scanner">
          {[[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, y], i) => (
            <span key={i} className="corner" style={{ [x ? 'right' : 'left']: 24, [y ? 'bottom' : 'top']: 24, borderRight: x ? undefined : 'none', borderLeft: x ? 'none' : undefined, borderBottom: y ? undefined : 'none', borderTop: y ? 'none' : undefined, borderRadius: 6 } as React.CSSProperties} />
          ))}
          <div className="line" />
          <div style={{ textAlign: 'center' }}><ScanLine size={46} color="#00d1b2" /><div className="muted mt8">Đưa thẻ / mã QR vào vùng quét</div></div>
        </div>
        <div className="row mt16">
          <input className="input grow" placeholder="Mã thẻ (VD: DF100001)" value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && run('in')} id="scan-code" />
          <button className="btn success" onClick={() => run('in')} id="scan-in"><LogIn size={16} /> Vào</button>
          <button className="btn" onClick={() => run('out')} id="scan-out"><LogOut size={16} /> Ra</button>
        </div>
        <div className="small dim mt16 mb16" style={{ marginBottom: 6 }}>Mô phỏng quẹt thẻ nhanh:</div>
        <div className="chips">{members.map((m) => <button key={m.id} className="chip" onClick={() => run(L.openCheckin(db, m.id) ? 'out' : 'in', m.cardCode!)} title={m.fullName}>{m.cardCode} · {m.fullName.split(' ').at(-1)}</button>)}</div>
      </div>
      <div>{res ? <ResultPanel r={res} /> : <div className="card" style={{ height: '100%' }}><Empty text="Kết quả quét sẽ hiển thị tại đây" icon={<ScanLine size={40} />} /></div>}</div>
    </div>
  );
}

export function StaffCheckinScreen() {
  const { db, user, act } = useApp();
  const br = user!.branchId!;
  const [tab, setTab] = useState<'scan' | 'manual'>('scan');
  const [q, setQ] = useState('');
  const [reason, setReason] = useState('Quên thẻ');
  const [res, setRes] = useState<Result | null>(null);

  const found = q.trim().length >= 2 ? db.users.filter((u) => u.role === 'member' && (u.fullName.toLowerCase().includes(q.toLowerCase()) || u.phone.includes(q) || u.cardCode?.toLowerCase().includes(q.toLowerCase()) || u.email.includes(q.toLowerCase()))).slice(0, 8) : [];
  const manualIn = (mid: string) => {
    const r = act((d) => L.checkIn(d, { code: mid, branchId: br, method: 'manual', staffId: user!.id, reason }));
    if (r) setRes(r.record.result === 'success' ? { ok: true, title: 'Đã check-in thủ công', memberId: mid, msg: `Lý do: ${reason}` } : { ok: false, title: 'Từ chối check-in', memberId: mid, msg: r.record.denyReason });
  };
  const manualOut = (mid: string) => {
    const r = act((d) => L.checkOut(d, { code: mid, method: 'manual', staffId: user!.id }));
    if (r) setRes({ ok: true, title: 'Đã check-out thủ công', memberId: mid });
  };
  const present = db.checkins.filter((c) => c.branchId === br && c.result === 'success' && !c.checkOutAt);

  return (
    <>
      <PageHead title="Check-in / Check-out" desc={<>Chi nhánh <b>{L.branchById(db, br)?.name}</b> · <span className="live-dot" /> {present.length} người đang có mặt · Tự động check-out lúc {L.branchById(db, br)?.closeTime}</>} />
      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'scan', label: <><ScanLine size={15} /> Quét thẻ / QR</> }, { id: 'manual', label: <><Keyboard size={15} /> Nhập thủ công</> }]} />
      {tab === 'scan' ? <Scanner branchId={br} staffId={user!.id} /> : (
        <div className="grid g2">
          <div className="card">
            <div className="field"><label>Tìm hội viên (tên, SĐT, email, mã thẻ)</label><div className="input-icon"><Search size={17} /><input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nhập ít nhất 2 ký tự" id="manual-search" /></div></div>
            <div className="field mt16"><label>Lý do nhập thủ công</label><div className="chips">{['Quên thẻ', 'Thẻ bị hỏng', 'Máy quét lỗi', 'Khác'].map((r) => <button key={r} className={`chip ${reason === r ? 'on' : ''}`} onClick={() => setReason(r)}>{r}</button>)}</div></div>
            <div className="col mt16">
              {found.map((m) => {
                const open = L.openCheckin(db, m.id);
                return (
                  <div className="list-item" key={m.id}>
                    <Avatar user={m} size="sm" />
                    <div className="grow"><b>{m.fullName}</b><div className="small dim">{m.cardCode} · {m.phone}</div></div>
                    {open ? <button className="btn sm" onClick={() => manualOut(m.id)}><LogOut size={14} /> Check-out</button> : <button className="btn sm success" onClick={() => manualIn(m.id)} id={`manual-in-${m.id}`}><LogIn size={14} /> Check-in</button>}
                  </div>
                );
              })}
              {q.length >= 2 && found.length === 0 && <Empty text="Không tìm thấy hội viên" />}
            </div>
          </div>
          <div>{res ? <ResultPanel r={res} /> : <div className="card"><Empty text="Hệ thống áp dụng cùng điều kiện như quét thẻ và ghi nhận nhân viên thực hiện + lý do." /></div>}</div>
        </div>
      )}
    </>
  );
}

export function Kiosk() {
  const { db } = useApp();
  const [br, setBr] = useState(db.branches[0].id);
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 32 }}>
      <div className="row between mb16">
        <div className="brand" style={{ padding: 0 }}><div className="brand-logo"><Zap size={22} color="#fff" fill="#fff" /></div><div><div className="brand-name">DFGym<span className="grad-text">Center</span></div><div className="brand-sub">Kiosk check-in</div></div></div>
        <div className="row"><select className="input" value={br} onChange={(e) => setBr(e.target.value)} id="kiosk-branch">{db.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select><Link to="/login" className="btn"><ArrowLeft size={16} /> Thoát</Link></div>
      </div>
      <div className="card mb16 row"><span className="live-dot" /> <b>{L.presentCount(db, br)}</b> người đang tập tại {L.branchById(db, br)?.name} · Giờ mở cửa {L.branchById(db, br)?.openTime}–{L.branchById(db, br)?.closeTime}</div>
      <Scanner branchId={br} />
    </div>
  );
}

export function CheckinHistory() {
  const { db, user } = useApp();
  const isAdmin = user!.role === 'admin';
  const [br, setBr] = useState(isAdmin ? 'all' : user!.branchId!);
  const [res, setRes] = useState<'all' | 'success' | 'denied'>('all');
  const [method, setMethod] = useState<'all' | 'card' | 'manual'>('all');
  const [date, setDate] = useState('');
  const [q, setQ] = useState('');
  const list = db.checkins.filter((c) => (br === 'all' || c.branchId === br) && (res === 'all' || c.result === res) && (method === 'all' || c.method === method) && (!date || new Date(c.checkInAt).toLocaleDateString('sv-SE') === date) && (!q || L.userById(db, c.memberId)?.fullName.toLowerCase().includes(q.toLowerCase()) || L.userById(db, c.memberId)?.cardCode?.toLowerCase().includes(q.toLowerCase())));
  const exportCsv = () => {
    const rows = [['Hội viên', 'Mã thẻ', 'Chi nhánh', 'Vào', 'Ra', 'Hình thức', 'Kết quả', 'Lý do', 'Nhân viên']].concat(
      list.map((c) => [L.userById(db, c.memberId)?.fullName ?? '', L.userById(db, c.memberId)?.cardCode ?? '', L.branchById(db, c.branchId)?.name ?? '', fmtDateTime(c.checkInAt), fmtDateTime(c.checkOutAt), c.method, c.result, c.denyReason ?? c.reason ?? '', L.userById(db, c.staffId)?.fullName ?? '']),
    );
    const blob = new Blob(['\ufeff' + rows.map((r) => r.map((x) => `"${x}"`).join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'lich-su-checkin.csv';
    a.click();
  };
  return (
    <>
      <PageHead title="Lịch sử check-in" desc={`${list.length} lượt · ${list.filter((c) => c.result === 'denied').length} bị từ chối · ${list.filter((c) => c.method === 'manual').length} nhập thủ công`} actions={<button className="btn" onClick={exportCsv}><Download size={16} /> Xuất CSV</button>} />
      <div className="row wrap mb16">
        {isAdmin && <select className="input" style={{ width: 200 }} value={br} onChange={(e) => setBr(e.target.value)}><option value="all">Tất cả chi nhánh</option>{db.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>}
        <select className="input" style={{ width: 160 }} value={res} onChange={(e) => setRes(e.target.value as typeof res)}><option value="all">Mọi kết quả</option><option value="success">Hợp lệ</option><option value="denied">Bị từ chối</option></select>
        <select className="input" style={{ width: 160 }} value={method} onChange={(e) => setMethod(e.target.value as typeof method)}><option value="all">Mọi hình thức</option><option value="card">Quét thẻ</option><option value="manual">Thủ công</option></select>
        <input type="date" className="input" style={{ width: 170 }} value={date} onChange={(e) => setDate(e.target.value)} />
        <div className="input-icon grow" style={{ minWidth: 200 }}><Search size={17} /><input className="input" placeholder="Tìm hội viên..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Hội viên</th><th>Chi nhánh</th><th>Vào</th><th>Ra</th><th>Hình thức</th><th>Kết quả</th><th>Ghi chú</th></tr></thead>
          <tbody>
            {list.slice(0, 200).map((c) => {
              const m = L.userById(db, c.memberId);
              return (
                <tr key={c.id}>
                  <td><div className="row"><Avatar user={m} size="sm" /><div><b>{m?.fullName}</b><div className="small dim">{m?.cardCode}</div></div></div></td>
                  <td className="small">{L.branchById(db, c.branchId)?.name}</td>
                  <td className="small">{fmtDateTime(c.checkInAt)}</td>
                  <td className="small">{c.checkOutAt ? <>{fmtTime(c.checkOutAt)} {c.checkoutMethod === 'auto' && <Badge color="gray" plain>Tự động</Badge>}{c.checkoutMethod === 'manual' && <Badge color="amber" plain>Thủ công</Badge>}</> : c.result === 'success' ? <Badge color="green">Đang tập</Badge> : '—'}</td>
                  <td>{c.method === 'card' ? <Badge color="blue" plain>Quét thẻ</Badge> : <Badge color="amber" plain>Thủ công</Badge>}</td>
                  <td><Badge color={c.result === 'success' ? 'green' : 'red'}>{c.result === 'success' ? 'Hợp lệ' : 'Từ chối'}</Badge></td>
                  <td className="small muted">{c.denyReason ?? (c.method === 'manual' ? `${c.reason} · NV ${L.userById(db, c.staffId)?.fullName}` : '')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {list.length === 0 && <Empty text="Không có dữ liệu" icon={<History size={40} />} />}
      </div>
    </>
  );
}

export default StaffCheckinScreen;
