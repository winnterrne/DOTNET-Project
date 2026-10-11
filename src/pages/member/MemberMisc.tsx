import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { Save, Plus, Scale, Ruler, Percent, Dumbbell, Activity, Receipt, Wrench, QrCode, MapPin, Clock, Trash2, Wifi } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import * as L from '../../store/logic';
import { Avatar, Badge, Empty, Modal, PageHead, StatCard, FakeQR, Tabs } from '../../components/ui';
import { mStatusLabel, methodLabel, reportLabel, eqLabel } from '../../components/labels';
import { fmtDate, fmtDateTime, fmtMoney, todayStr, calcBMI, bmiLabel, uid as genId, fmtTime } from '../../utils';
import type { User } from '../../types';

/* ================= Hồ sơ ================= */
export function MemberProfile() {
  const { user, act } = useApp();
  const [f, setF] = useState<User>(user!);
  const [pw, setPw] = useState({ old: '', n1: '', n2: '' });
  const set = (k: keyof User) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const save = () =>
    act((d) => {
      const u = d.users.find((x) => x.id === user!.id)!;
      if (!f.fullName.trim()) throw new Error('Họ tên không được để trống');
      Object.assign(u, { fullName: f.fullName, phone: f.phone, gender: f.gender, dob: f.dob, address: f.address });
    }, 'Đã lưu hồ sơ');
  const changePw = () =>
    act((d) => {
      const u = d.users.find((x) => x.id === user!.id)!;
      if (u.password !== pw.old) throw new Error('Mật khẩu hiện tại không đúng');
      if (pw.n1.length < 6) throw new Error('Mật khẩu mới tối thiểu 6 ký tự');
      if (pw.n1 !== pw.n2) throw new Error('Xác nhận mật khẩu không khớp');
      u.password = pw.n1;
      setPw({ old: '', n1: '', n2: '' });
    }, 'Đổi mật khẩu thành công');
  return (
    <>
      <PageHead title="Hồ sơ cá nhân" desc="Cập nhật thông tin liên hệ và bảo mật tài khoản." />
      <div className="grid g3">
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}><Avatar user={f} size="lg" /></div>
          <h2 className="mt16">{f.fullName}</h2>
          <div className="small muted">{f.email}</div>
          {user!.cardCode && <div className="mt16"><Badge color="purple">Mã thẻ: {user!.cardCode}</Badge></div>}
          <div className="small dim mt16">Thành viên từ {fmtDate(user!.createdAt)}</div>
        </div>
        <div className="card span2">
          <div className="card-head"><h2>Thông tin cá nhân</h2></div>
          <div className="form-grid">
            <div className="field"><label>Họ và tên</label><input className="input" value={f.fullName} onChange={set('fullName')} id="profile-name" /></div>
            <div className="field"><label>Email</label><input className="input" value={f.email} disabled /></div>
            <div className="field"><label>Số điện thoại</label><input className="input" value={f.phone} onChange={set('phone')} id="profile-phone" /></div>
            <div className="field"><label>Ngày sinh</label><input type="date" className="input" value={f.dob} onChange={set('dob')} /></div>
            <div className="field"><label>Giới tính</label><select className="input" value={f.gender} onChange={set('gender')}><option value="male">Nam</option><option value="female">Nữ</option><option value="other">Khác</option></select></div>
            <div className="field"><label>Địa chỉ</label><input className="input" value={f.address} onChange={set('address')} /></div>
          </div>
          <div className="row mt16" style={{ justifyContent: 'flex-end' }}><button className="btn primary" onClick={save} id="profile-save"><Save size={16} /> Lưu thay đổi</button></div>
          <div className="divider" />
          <h3 className="mb16">Đổi mật khẩu</h3>
          <div className="grid g3" style={{ gap: 12 }}>
            <input type="password" className="input" placeholder="Mật khẩu hiện tại" value={pw.old} onChange={(e) => setPw({ ...pw, old: e.target.value })} />
            <input type="password" className="input" placeholder="Mật khẩu mới" value={pw.n1} onChange={(e) => setPw({ ...pw, n1: e.target.value })} />
            <input type="password" className="input" placeholder="Xác nhận" value={pw.n2} onChange={(e) => setPw({ ...pw, n2: e.target.value })} />
          </div>
          <div className="row mt16" style={{ justifyContent: 'flex-end' }}><button className="btn" onClick={changePw}>Cập nhật mật khẩu</button></div>
        </div>
      </div>
    </>
  );
}

/* ================= Tiến độ ================= */
export function MemberProgress() {
  const { db, user, act } = useApp();
  const [open, setOpen] = useState(false);
  const [metric, setMetric] = useState<'weight' | 'bodyFat' | 'muscleMass' | 'bmi'>('weight');
  const list = db.bodyMetrics.filter((m) => m.memberId === user!.id).sort((a, b) => a.date.localeCompare(b.date));
  const first = list[0];
  const last = list.at(-1);
  const delta = (k: 'weight' | 'bodyFat' | 'muscleMass' | 'bmi') => (first && last && first[k] != null && last[k] != null ? +(last[k]! - first[k]!).toFixed(1) : 0);
  const meta = {
    weight: { label: 'Cân nặng (kg)', color: '#a78bfa' },
    bodyFat: { label: 'Tỷ lệ mỡ (%)', color: '#ff5c8a' },
    muscleMass: { label: 'Khối lượng cơ (kg)', color: '#00d1b2' },
    bmi: { label: 'BMI', color: '#ffb020' },
  };
  return (
    <>
      <PageHead title="Tiến độ & chỉ số cơ thể" desc={first ? `Mốc ban đầu: ${fmtDate(first.date)} – ${list.length} lần đo` : 'Ghi nhận chỉ số ban đầu để làm mốc theo dõi tiến độ.'} actions={<button className="btn primary" onClick={() => setOpen(true)} id="add-metric"><Plus size={16} /> {first ? 'Cập nhật chỉ số' : 'Ghi nhận chỉ số ban đầu'}</button>} />
      {!last ? <div className="card"><Empty text="Chưa có dữ liệu. Hãy ghi nhận lần đo đầu tiên!" icon={<Activity size={40} />} /></div> : (
        <>
          <div className="grid g4 mb16">
            <StatCard icon={<Scale size={22} />} label="Cân nặng" value={`${last.weight} kg`} color="#a78bfa" trend={list.length > 1 ? { v: `${delta('weight')} kg`, up: delta('weight') <= 0 } : undefined} />
            <StatCard icon={<Ruler size={22} />} label={`BMI · ${bmiLabel(last.bmi)}`} value={last.bmi} color="#ffb020" trend={list.length > 1 ? { v: `${delta('bmi')}`, up: delta('bmi') <= 0 } : undefined} />
            <StatCard icon={<Percent size={22} />} label="Tỷ lệ mỡ" value={last.bodyFat != null ? `${last.bodyFat}%` : '—'} color="#ff5c8a" trend={list.length > 1 && last.bodyFat != null ? { v: `${delta('bodyFat')}%`, up: delta('bodyFat') <= 0 } : undefined} />
            <StatCard icon={<Dumbbell size={22} />} label="Khối lượng cơ" value={last.muscleMass != null ? `${last.muscleMass} kg` : '—'} color="#00d1b2" trend={list.length > 1 && last.muscleMass != null ? { v: `+${delta('muscleMass')} kg`, up: delta('muscleMass') >= 0 } : undefined} />
          </div>
          <div className="card mb16">
            <div className="card-head">
              <h2><Activity size={18} /> Biểu đồ tiến độ</h2>
              <div className="chips">{(Object.keys(meta) as (keyof typeof meta)[]).map((k) => <button key={k} className={`chip ${metric === k ? 'on' : ''}`} onClick={() => setMetric(k)}>{meta[k].label}</button>)}</div>
            </div>
            <div style={{ height: 320 }}>
              <ResponsiveContainer>
                <LineChart data={list.map((m) => ({ ...m, d: fmtDate(m.date).slice(0, 5) }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="d" axisLine={false} tickLine={false} />
                  <YAxis domain={['dataMin - 1', 'dataMax + 1']} axisLine={false} tickLine={false} width={40} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey={metric} name={meta[metric].label} stroke={meta[metric].color} strokeWidth={3} dot={{ r: 5, fill: meta[metric].color }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Ngày đo</th><th>Cân nặng</th><th>Chiều cao</th><th>BMI</th><th>% mỡ</th><th>Cơ (kg)</th><th>Ghi chú</th><th></th></tr></thead>
              <tbody>
                {[...list].reverse().map((m) => (
                  <tr key={m.id}>
                    <td>{fmtDate(m.date)} {m.id === first!.id && <Badge color="purple" plain>Mốc ban đầu</Badge>}</td>
                    <td><b>{m.weight}</b> kg</td><td>{m.height} cm</td><td>{m.bmi}</td><td>{m.bodyFat ?? '—'}</td><td>{m.muscleMass ?? '—'}</td>
                    <td className="small muted">{m.note}</td>
                    <td><button className="btn ghost sm" onClick={() => act((d) => { d.bodyMetrics = d.bodyMetrics.filter((x) => x.id !== m.id); }, 'Đã xóa bản ghi')}><Trash2 size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {open && <MetricModal lastHeight={last?.height} onClose={() => setOpen(false)} />}
    </>
  );
}

function MetricModal({ lastHeight, onClose }: { lastHeight?: number; onClose: () => void }) {
  const { user, act } = useApp();
  const [f, setF] = useState({ date: todayStr(), weight: '', height: String(lastHeight ?? ''), bodyFat: '', muscleMass: '', note: '' });
  const bmi = calcBMI(+f.weight, +f.height);
  const save = () => {
    const r = act((d) => {
      if (!+f.weight || !+f.height) throw new Error('Vui lòng nhập cân nặng và chiều cao hợp lệ');
      d.bodyMetrics.push({ id: genId('bm'), memberId: user!.id, date: f.date, weight: +f.weight, height: +f.height, bmi, bodyFat: f.bodyFat ? +f.bodyFat : undefined, muscleMass: f.muscleMass ? +f.muscleMass : undefined, note: f.note });
      return true;
    }, 'Đã lưu chỉ số cơ thể');
    if (r) onClose();
  };
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal title="Cập nhật chỉ số cơ thể" onClose={onClose} footer={<><button className="btn" onClick={onClose}>Hủy</button><button className="btn primary" onClick={save} id="metric-save">Lưu</button></>}>
      <div className="form-grid">
        <div className="field"><label>Ngày đo</label><input type="date" className="input" value={f.date} max={todayStr()} onChange={set('date')} /></div>
        <div className="field"><label>Cân nặng (kg) *</label><input type="number" step="0.1" className="input" value={f.weight} onChange={set('weight')} id="metric-weight" /></div>
        <div className="field"><label>Chiều cao (cm) *</label><input type="number" className="input" value={f.height} onChange={set('height')} id="metric-height" /></div>
        <div className="field"><label>BMI (tự tính)</label><input className="input" value={bmi ? `${bmi} – ${bmiLabel(bmi)}` : ''} disabled /></div>
        <div className="field"><label>Tỷ lệ mỡ (%)</label><input type="number" step="0.1" className="input" value={f.bodyFat} onChange={set('bodyFat')} /></div>
        <div className="field"><label>Khối lượng cơ (kg)</label><input type="number" step="0.1" className="input" value={f.muscleMass} onChange={set('muscleMass')} /></div>
        <div className="field full"><label>Ghi chú</label><input className="input" value={f.note} onChange={set('note')} /></div>
      </div>
    </Modal>
  );
}

/* ================= Thẻ hội viên ================= */
export function MemberCard() {
  const { db, user } = useApp();
  const cur = L.membershipOn(db, user!.id);
  const plan = cur ? L.planById(db, cur.planId) : undefined;
  const st = cur ? L.membershipStatus(db, cur) : 'expired';
  const open = L.openCheckin(db, user!.id);
  const history = db.checkins.filter((c) => c.memberId === user!.id).slice(0, 12);
  return (
    <>
      <PageHead title="Thẻ hội viên" desc="Đưa mã QR này vào máy quét tại quầy để check-in / check-out." />
      <div className="grid g2">
        <div className="col" style={{ gap: 18 }}>
          <div className="member-card">
            <div style={{ position: 'relative' }}>
              <div className="row between">
                <div className="brand-name">DFGym<span style={{ color: '#ff8fb0' }}>Center</span></div>
                <Wifi size={22} style={{ transform: 'rotate(90deg)', opacity: 0.7 }} />
              </div>
              <div className="row between mt24" style={{ alignItems: 'flex-end' }}>
                <div>
                  <div className="small" style={{ opacity: 0.7 }}>Hội viên</div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{user!.fullName}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 18, letterSpacing: 3, marginTop: 6 }}>{user!.cardCode}</div>
                  <div className="row mt16">
                    {plan ? <Badge color="pink">{plan.name}</Badge> : <Badge color="gray">Chưa có gói</Badge>}
                    <Badge color={mStatusLabel[st][1]}>{mStatusLabel[st][0]}</Badge>
                  </div>
                  {cur && <div className="small mt8" style={{ opacity: 0.75 }}>HSD: {fmtDate(cur.endDate)}</div>}
                </div>
                <FakeQR text={user!.cardCode ?? user!.id} size={120} />
              </div>
            </div>
          </div>
          <div className="card">
            {open ? (
              <div className="row"><span className="live-dot" /><div><b>Đang tập tại {L.branchById(db, open.branchId)?.name}</b><div className="small muted">Check-in lúc {fmtTime(open.checkInAt)} · nhớ check-out khi ra về (tự động check-out lúc đóng cửa)</div></div></div>
            ) : (
              <div className="row muted"><QrCode size={18} /> Hiện bạn không ở phòng tập.</div>
            )}
            {plan && <div className="small muted mt16"><MapPin size={13} /> Áp dụng: {L.scopeLabel(db, plan.branchScope)}</div>}
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h2><Clock size={18} /> Lịch sử ra/vào</h2></div>
          {history.length === 0 ? <Empty text="Chưa có lượt check-in" /> : (
            <div className="col">
              {history.map((c) => (
                <div className="list-item" key={c.id}>
                  <div className="grow">
                    <div className="bold">{L.branchById(db, c.branchId)?.name}</div>
                    <div className="small muted">{fmtDateTime(c.checkInAt)}{c.checkOutAt && ` → ${fmtTime(c.checkOutAt)}`}{c.method === 'manual' && ' · Lễ tân nhập tay'}</div>
                    {c.denyReason && <div className="small" style={{ color: '#ff8aa0' }}>{c.denyReason}</div>}
                  </div>
                  <Badge color={c.result === 'success' ? 'green' : 'red'}>{c.result === 'success' ? 'Hợp lệ' : 'Từ chối'}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ================= Giao dịch ================= */
export function MemberPayments() {
  const { db, user } = useApp();
  const list = db.payments.filter((p) => p.memberId === user!.id);
  const total = list.filter((p) => p.status === 'success').reduce((s, p) => s + p.amount, 0);
  return (
    <>
      <PageHead title="Lịch sử giao dịch" desc={`${list.length} giao dịch · Tổng đã thanh toán ${fmtMoney(total)}`} />
      {list.length === 0 ? <div className="card"><Empty text="Chưa có giao dịch" icon={<Receipt size={40} />} /></div> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Mã GD</th><th>Thời gian</th><th>Nội dung</th><th>Chi nhánh</th><th>Phương thức</th><th>Số tiền</th><th>Trạng thái</th></tr></thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td className="small dim" style={{ fontFamily: 'monospace' }}>{p.id.toUpperCase().slice(0, 12)}</td>
                  <td className="small">{fmtDateTime(p.createdAt)}</td>
                  <td>{p.description}</td>
                  <td className="small">{L.branchById(db, p.branchId)?.name}</td>
                  <td className="small">{methodLabel[p.method]}</td>
                  <td className="bold">{fmtMoney(p.amount)}</td>
                  <td><Badge color={p.status === 'success' ? 'green' : 'red'}>{p.status === 'success' ? 'Thành công' : 'Thất bại'}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

/* ================= Báo thiết bị hỏng ================= */
export function MemberEquipment() {
  const { db, user, act } = useApp();
  const [tab, setTab] = useState<'mine' | 'new'>('mine');
  const [branch, setBranch] = useState(db.branches[0].id);
  const [eq, setEq] = useState('');
  const [desc, setDesc] = useState('');
  const mine = db.equipmentReports.filter((r) => r.reporterId === user!.id);
  const eqs = db.equipment.filter((e) => e.branchId === branch && e.status !== 'retired');
  const submit = () => {
    const r = act((d) => { if (!eq) throw new Error('Chọn thiết bị'); if (!desc.trim()) throw new Error('Mô tả sự cố'); L.reportEquipment(d, user!.id, eq, desc.trim()); return true; }, 'Đã gửi phản ánh, cảm ơn bạn!');
    if (r) { setDesc(''); setEq(''); setTab('mine'); }
  };
  return (
    <>
      <PageHead title="Phản ánh thiết bị" desc="Phát hiện thiết bị hỏng hoặc sự cố? Hãy báo cho chúng tôi." />
      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'mine', label: 'Phản ánh của tôi', count: mine.filter((r) => r.status !== 'resolved').length }, { id: 'new', label: <><Wrench size={15} /> Gửi phản ánh mới</> }]} />
      {tab === 'new' ? (
        <div className="card" style={{ maxWidth: 720 }}>
          <div className="form-grid">
            <div className="field"><label>Chi nhánh</label><select className="input" value={branch} onChange={(e) => { setBranch(e.target.value); setEq(''); }}>{db.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
            <div className="field"><label>Thiết bị</label><select className="input" value={eq} onChange={(e) => setEq(e.target.value)} id="eq-select"><option value="">— Chọn thiết bị —</option>{eqs.map((e) => <option key={e.id} value={e.id}>{e.code} · {e.name} ({eqLabel[e.status][0]})</option>)}</select></div>
            <div className="field full"><label>Mô tả sự cố</label><textarea className="input" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="VD: Băng chạy bị trượt, phát tiếng kêu..." id="eq-desc" /></div>
          </div>
          <div className="row mt16" style={{ justifyContent: 'flex-end' }}><button className="btn primary" onClick={submit} id="eq-submit">Gửi phản ánh</button></div>
        </div>
      ) : mine.length === 0 ? <div className="card"><Empty text="Bạn chưa gửi phản ánh nào" /></div> : (
        <div className="grid g2">
          {mine.map((r) => {
            const e = db.equipment.find((x) => x.id === r.equipmentId);
            return (
              <div className="card" key={r.id}>
                <div className="row between"><div><b>{e?.name}</b><div className="small dim">{e?.code} · {L.branchById(db, r.branchId)?.name}</div></div><Badge color={reportLabel[r.status][1]}>{reportLabel[r.status][0]}</Badge></div>
                <p className="muted mt8">{r.description}</p>
                <div className="divider" />
                <div className="col" style={{ gap: 8 }}>
                  {r.updates.map((u, i) => (
                    <div key={i} className="row small" style={{ alignItems: 'flex-start' }}>
                      <span style={{ width: 8, height: 8, borderRadius: 4, marginTop: 6, background: 'var(--primary-2)', flexShrink: 0 }} />
                      <div><b>{reportLabel[u.status][0]}</b> · <span className="dim">{fmtDateTime(u.at)} · {L.userById(db, u.by)?.fullName}</span><div className="muted">{u.note}</div></div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
