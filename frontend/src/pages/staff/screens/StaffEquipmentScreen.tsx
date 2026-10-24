import { useState } from 'react';
import { Wrench, Plus } from 'lucide-react';
import { useApp } from '../../../store/AppContext';
import * as L from '../../../store/logic';
import { Badge, Empty, Modal, PageHead, StatCard, Tabs } from '../../../components/ui';
import { reportLabel, eqLabel } from '../../../components/labels';
import { fmtDate, fmtDateTime, todayStr, uid as genId } from '../../../utils';
import type { ReportStatus, EquipmentStatus } from '../../../types';

export function StaffEquipmentScreen() {
  const { db, user, act } = useApp();
  const isAdmin = user!.role === 'admin';
  const [tab, setTab] = useState<'reports' | 'list' | 'summary'>(isAdmin ? 'summary' : 'reports');
  const [br, setBr] = useState(isAdmin ? 'all' : user!.branchId!);
  const [upd, setUpd] = useState<string | null>(null);
  const [add, setAdd] = useState(false);
  const [rec, setRec] = useState(false);
  const inBr = (b: string) => br === 'all' || b === br;
  const reports = db.equipmentReports.filter((r) => inBr(r.branchId));
  const eqs = db.equipment.filter((e) => inBr(e.branchId));

  return (
    <>
      <PageHead
        title="Thiết bị & sự cố"
        desc={isAdmin ? 'Báo cáo tình trạng thiết bị toàn hệ thống.' : 'Tiếp nhận phản ánh, ghi nhận thiết bị hỏng và cập nhật sau sửa chữa.'}
        actions={<>
          {isAdmin && <select className="input" style={{ width: 200 }} value={br} onChange={(e) => setBr(e.target.value)}><option value="all">Tất cả chi nhánh</option>{db.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>}
          {!isAdmin && <button className="btn" onClick={() => setRec(true)} id="record-broken"><Wrench size={16} /> Ghi nhận thiết bị hỏng</button>}
          {isAdmin && <button className="btn primary" onClick={() => setAdd(true)} id="add-equipment"><Plus size={16} /> Thêm thiết bị</button>}
        </>}
      />
      <Tabs value={tab} onChange={setTab} tabs={[...(isAdmin ? [{ id: 'summary' as const, label: 'Tổng quan' }] : []), { id: 'reports', label: 'Phản ánh / sự cố', count: reports.filter((r) => r.status === 'pending').length }, { id: 'list', label: 'Danh sách thiết bị' }]} />
      {tab === 'summary' && (
        <>
          <div className="grid g4 mb16">
            {(['active', 'broken', 'repairing', 'retired'] as EquipmentStatus[]).map((s) => <StatCard key={s} icon={<Wrench size={22} />} label={eqLabel[s][0]} value={eqs.filter((e) => e.status === s).length} color={{ active: '#2ed47a', broken: '#ff4d6d', repairing: '#ffb020', retired: '#6d7290' }[s]} />)}
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Chi nhánh</th><th>Tổng</th><th>Hoạt động</th><th>Hỏng</th><th>Đang sửa</th><th>Thanh lý</th><th>Sự cố mở</th><th>Tỷ lệ sẵn sàng</th></tr></thead>
              <tbody>{db.branches.map((b) => { const l = db.equipment.filter((e) => e.branchId === b.id); const act2 = l.filter((e) => e.status === 'active').length; const usable = l.filter((e) => e.status !== 'retired').length; return (
                <tr key={b.id}><td><b>{b.name}</b></td><td>{l.length}</td><td>{act2}</td><td style={{ color: '#ff8aa0' }}>{l.filter((e) => e.status === 'broken').length}</td><td style={{ color: '#ffc857' }}>{l.filter((e) => e.status === 'repairing').length}</td><td>{l.filter((e) => e.status === 'retired').length}</td><td>{db.equipmentReports.filter((r) => r.branchId === b.id && ['pending', 'in_progress'].includes(r.status)).length}</td><td><b>{usable ? Math.round((act2 / usable) * 100) : 0}%</b></td></tr>); })}</tbody>
            </table>
          </div>
        </>
      )}
      {tab === 'reports' && (reports.length === 0 ? <div className="card"><Empty text="Không có phản ánh" /></div> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Thiết bị</th><th>Chi nhánh</th><th>Người báo</th><th>Mô tả</th><th>Thời gian</th><th>Trạng thái</th><th></th></tr></thead>
            <tbody>{reports.map((r) => { const e = db.equipment.find((x) => x.id === r.equipmentId); return (
              <tr key={r.id}><td><b>{e?.name}</b><div className="small dim">{e?.code}</div></td><td className="small">{L.branchById(db, r.branchId)?.name}</td><td className="small">{L.userById(db, r.reporterId)?.fullName}</td><td className="small muted" style={{ maxWidth: 260 }}>{r.description}<div className="dim">{r.updates.at(-1)?.note !== r.description && r.updates.at(-1)?.note}</div></td><td className="small">{fmtDateTime(r.createdAt)}</td><td><Badge color={reportLabel[r.status][1]}>{reportLabel[r.status][0]}</Badge></td><td>{!isAdmin && r.status !== 'resolved' && r.status !== 'rejected' && <button className="btn sm" onClick={() => setUpd(r.id)} id={`update-${r.id}`}>Cập nhật</button>}</td></tr>); })}</tbody>
          </table>
        </div>
      ))}
      {tab === 'list' && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Mã</th><th>Thiết bị</th><th>Loại</th><th>Chi nhánh</th><th>Ngày nhập</th><th>Tình trạng</th>{isAdmin && <th></th>}</tr></thead>
            <tbody>{eqs.map((e) => (
              <tr key={e.id}><td className="small" style={{ fontFamily: 'monospace' }}>{e.code}</td><td><b>{e.name}</b></td><td className="small">{e.category}</td><td className="small">{L.branchById(db, e.branchId)?.name}</td><td className="small">{fmtDate(e.addedAt)}</td><td><Badge color={eqLabel[e.status][1]}>{eqLabel[e.status][0]}</Badge></td>
                {isAdmin && <td>{e.status !== 'retired' && <button className="btn ghost sm" onClick={() => act((d) => { d.equipment.find((x) => x.id === e.id)!.status = 'retired'; }, 'Đã chuyển sang thanh lý')}>Thanh lý</button>}</td>}</tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {upd && <UpdateReportModal id={upd} onClose={() => setUpd(null)} />}
      {add && <AddEquipmentModal onClose={() => setAdd(false)} />}
      {rec && <RecordBrokenModal onClose={() => setRec(false)} />}
    </>
  );
}

function UpdateReportModal({ id, onClose }: { id: string; onClose: () => void }) {
  const { db, user, act } = useApp();
  const r = db.equipmentReports.find((x) => x.id === id)!;
  const [status, setStatus] = useState<ReportStatus>(r.status === 'pending' ? 'in_progress' : 'resolved');
  const [note, setNote] = useState('');
  return (
    <Modal title="Cập nhật xử lý sự cố" onClose={onClose} footer={<><button className="btn" onClick={onClose}>Hủy</button><button className="btn primary" onClick={() => { act((d) => L.updateReport(d, id, user!.id, status, note), 'Đã cập nhật'); onClose(); }} id="report-save">Lưu</button></>}>
      <div className="field"><label>Trạng thái</label><div className="chips">{(['in_progress', 'resolved', 'rejected'] as ReportStatus[]).map((s) => <button key={s} className={`chip ${status === s ? 'on' : ''}`} onClick={() => setStatus(s)}>{reportLabel[s][0]}</button>)}</div></div>
      <div className="field mt16"><label>Ghi chú quá trình xử lý</label><textarea className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="VD: Đã thay dây curoa..." /></div>
    </Modal>
  );
}

function RecordBrokenModal({ onClose }: { onClose: () => void }) {
  const { db, user, act } = useApp();
  const eqs = db.equipment.filter((e) => e.branchId === user!.branchId && e.status === 'active');
  const [eq, setEq] = useState('');
  const [desc, setDesc] = useState('');
  return (
    <Modal title="Ghi nhận thiết bị hỏng" onClose={onClose} footer={<><button className="btn" onClick={onClose}>Hủy</button><button className="btn primary" disabled={!eq || !desc} onClick={() => { act((d) => L.reportEquipment(d, user!.id, eq, desc), 'Đã ghi nhận'); onClose(); }}>Ghi nhận</button></>}>
      <div className="field"><label>Thiết bị</label><select className="input" value={eq} onChange={(e) => setEq(e.target.value)}><option value="">— Chọn —</option>{eqs.map((e) => <option key={e.id} value={e.id}>{e.code} · {e.name}</option>)}</select></div>
      <div className="field mt16"><label>Tình trạng</label><textarea className="input" value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
    </Modal>
  );
}

function AddEquipmentModal({ onClose }: { onClose: () => void }) {
  const { db, act } = useApp();
  const [f, setF] = useState({ name: '', category: 'Cardio', branchId: db.branches[0].id, qty: 1 });
  const save = () => {
    const r = act((d) => {
      if (!f.name.trim()) throw new Error('Nhập tên thiết bị');
      for (let i = 0; i < f.qty; i++) {
        const n = d.equipment.filter((e) => e.branchId === f.branchId).length + 1;
        d.equipment.push({ id: genId('eq'), branchId: f.branchId, name: f.name, category: f.category, code: `${f.branchId.toUpperCase()}-${String(n).padStart(3, '0')}`, status: 'active', addedAt: todayStr() });
      }
      return true;
    }, `Đã thêm ${f.qty} thiết bị`);
    if (r) onClose();
  };
  return (
    <Modal title="Thêm thiết bị mới" onClose={onClose} footer={<><button className="btn" onClick={onClose}>Hủy</button><button className="btn primary" onClick={save} id="equipment-save">Thêm</button></>}>
      <div className="form-grid">
        <div className="field full"><label>Tên thiết bị</label><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} id="equipment-name" /></div>
        <div className="field"><label>Loại</label><select className="input" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{['Cardio', 'Sức mạnh', 'Tạ tự do', 'Phụ kiện'].map((c) => <option key={c}>{c}</option>)}</select></div>
        <div className="field"><label>Số lượng</label><input type="number" min={1} className="input" value={f.qty} onChange={(e) => setF({ ...f, qty: Math.max(1, +e.target.value) })} /></div>
        <div className="field full"><label>Chi nhánh</label><select className="input" value={f.branchId} onChange={(e) => setF({ ...f, branchId: e.target.value })}>{db.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
      </div>
    </Modal>
  );
}

export default StaffEquipmentScreen;
