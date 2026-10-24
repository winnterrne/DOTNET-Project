import { useState } from 'react';
import { Package, Plus, Edit2, Clock, Sparkles, MapPin, CalendarDays, Calendar } from 'lucide-react';
import { useApp } from '../../../store/AppContext';
import * as L from '../../../store/logic';
import { Badge, Modal, PageHead, Tabs } from '../../../components/ui';
import { fmtMoney, uid } from '../../../utils';
import type { MembershipPlan, PTPlan } from '../../../types';

export function AdminPlansScreen() {
  const { db, act } = useApp();
  const [tab, setTab] = useState<'membership' | 'pt'>('membership');
  const [msModal, setMsModal] = useState<MembershipPlan | 'new' | null>(null);
  const [ptModal, setPtModal] = useState<PTPlan | 'new' | null>(null);

  const toggleMsActive = (p: MembershipPlan) => {
    act((d) => {
      const target = d.membershipPlans.find((x) => x.id === p.id);
      if (target) target.active = !target.active;
    }, p.active ? 'Đã vô hiệu gói' : 'Đã kích hoạt gói');
  };

  const togglePtActive = (p: PTPlan) => {
    act((d) => {
      const target = d.ptPlans.find((x) => x.id === p.id);
      if (target) target.active = !target.active;
    }, p.active ? 'Đã vô hiệu gói PT' : 'Đã kích hoạt gói PT');
  };

  return (
    <>
      <PageHead
        title="Quản lý Danh mục Gói tập"
        desc="Cấu hình các gói hội viên và gói PT 1-kèm-1, phạm vi chi nhánh, số buổi PT tặng kèm và chính sách tạm ngưng (freeze)."
        actions={
          <button
            className="btn primary"
            onClick={() => (tab === 'membership' ? setMsModal('new') : setPtModal('new'))}
            id="btn-add-plan"
          >
            <Plus size={16} /> {tab === 'membership' ? 'Thêm gói hội viên' : 'Thêm gói PT'}
          </button>
        }
      />

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'membership', label: <><Package size={15} /> Gói Hội Viên</>, count: db.membershipPlans.length },
          { id: 'pt', label: <><Sparkles size={15} /> Gói Huấn Luyện Viên (PT)</>, count: db.ptPlans.length },
        ]}
      />

      {tab === 'membership' ? (
        <div className="grid g-auto">
          {db.membershipPlans.map((p) => (
            <div className="card plan-card hover" key={p.id} style={{ opacity: p.active ? 1 : 0.65 }}>
              <div className="plan-top" style={{ background: p.color }} />
              <div className="row between">
                <h2>{p.name}</h2>
                <Badge color={p.active ? 'green' : 'gray'}>{p.active ? 'Hoạt động' : 'Tạm dừng'}</Badge>
              </div>
              <div className="small muted mt8">{p.description}</div>
              <div className="price">{fmtMoney(p.price)}</div>
              <div className="small dim">Thời hạn: {p.durationMonths} tháng · Ưu tiên waitlist: Cấp {p.priority}</div>

              <ul>
                <li><MapPin size={14} /> Phạm vi: {L.scopeLabel(db, p.branchScope)}</li>
                <li><Sparkles size={14} /> Buổi PT tặng kèm: {p.freePTSessions || 'Không'}</li>
                <li><CalendarDays size={14} /> Freeze: {p.maxFreezeTimes ? `${p.maxFreezeTimes} lần (tối đa ${p.maxFreezeDays} ngày)` : 'Không cho phép'}</li>
                <li><Calendar size={14} /> Lớp nhóm: {p.classBookingsPerWeek ? `${p.classBookingsPerWeek} lượt/tuần` : 'Không giới hạn'}</li>
              </ul>

              <div className="row mt16" style={{ marginTop: 'auto', gap: 8 }}>
                <button className="btn sm ghost grow" onClick={() => setMsModal(p)} id={`edit-plan-${p.id}`}>
                  <Edit2 size={14} /> Chỉnh sửa
                </button>
                <button
                  className={`btn sm ${p.active ? 'danger' : 'success'}`}
                  onClick={() => toggleMsActive(p)}
                >
                  {p.active ? 'Tạm dừng' : 'Kích hoạt'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid g-auto">
          {db.ptPlans.map((p) => (
            <div className="card plan-card hover" key={p.id} style={{ opacity: p.active ? 1 : 0.65 }}>
              <div className="plan-top" style={{ background: 'var(--grad-teal)' }} />
              <div className="row between">
                <h2>{p.name}</h2>
                <Badge color={p.active ? 'green' : 'gray'}>{p.active ? 'Hoạt động' : 'Tạm dừng'}</Badge>
              </div>
              <div className="small muted mt8">{p.description}</div>
              <div className="price">{fmtMoney(p.price)}</div>
              <div className="small dim">≈ {fmtMoney(Math.round(p.price / p.sessions))}/buổi</div>

              <ul>
                <li><Sparkles size={14} /> Số buổi: {p.sessions} buổi tập 1-kèm-1</li>
                <li><Clock size={14} /> Thời hạn sử dụng: {p.validityDays} ngày</li>
                <li><MapPin size={14} /> Phạm vi: {L.scopeLabel(db, p.branchScope)}</li>
              </ul>

              <div className="row mt16" style={{ marginTop: 'auto', gap: 8 }}>
                <button className="btn sm ghost grow" onClick={() => setPtModal(p)} id={`edit-pt-plan-${p.id}`}>
                  <Edit2 size={14} /> Chỉnh sửa
                </button>
                <button
                  className={`btn sm ${p.active ? 'danger' : 'success'}`}
                  onClick={() => togglePtActive(p)}
                >
                  {p.active ? 'Tạm dừng' : 'Kích hoạt'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {msModal && (
        <MembershipPlanModal
          plan={msModal === 'new' ? null : msModal}
          onClose={() => setMsModal(null)}
        />
      )}

      {ptModal && (
        <PTPlanModal
          plan={ptModal === 'new' ? null : ptModal}
          onClose={() => setPtModal(null)}
        />
      )}
    </>
  );
}

function MembershipPlanModal({ plan, onClose }: { plan: MembershipPlan | null; onClose: () => void }) {
  const { db, act } = useApp();
  const [name, setName] = useState(plan?.name || '');
  const [durationMonths, setDurationMonths] = useState(plan?.durationMonths || 1);
  const [price, setPrice] = useState(plan?.price || 500000);
  const [priority, setPriority] = useState(plan?.priority || 1);
  const [freePTSessions, setFreePTSessions] = useState(plan?.freePTSessions || 0);
  const [maxFreezeTimes, setMaxFreezeTimes] = useState(plan?.maxFreezeTimes || 0);
  const [maxFreezeDays, setMaxFreezeDays] = useState(plan?.maxFreezeDays || 0);
  const [classBookingsPerWeek, setClassBookingsPerWeek] = useState(plan?.classBookingsPerWeek || 0);
  const [description, setDescription] = useState(plan?.description || '');
  const [color, setColor] = useState(plan?.color || '#7c5cff');
  const [scopeAll, setScopeAll] = useState(plan ? plan.branchScope === 'all' : true);
  const [selectedBranches, setSelectedBranches] = useState<string[]>(
    plan && Array.isArray(plan.branchScope) ? plan.branchScope : [db.branches[0]?.id || '']
  );

  const handleSave = () => {
    act((d) => {
      if (!name.trim()) throw new Error('Vui lòng nhập tên gói');
      const branchScope = scopeAll ? 'all' : selectedBranches;
      const data: MembershipPlan = {
        id: plan ? plan.id : uid('mp'),
        name: name.trim(),
        durationMonths,
        price,
        priority,
        freePTSessions,
        maxFreezeTimes,
        maxFreezeDays,
        classBookingsPerWeek,
        description,
        benefits: ['Tập luyện tại chi nhánh áp dụng', `${classBookingsPerWeek ? `${classBookingsPerWeek} lớp/tuần` : 'Lớp nhóm không giới hạn'}`],
        color,
        branchScope,
        active: plan ? plan.active : true,
      };

      if (plan) {
        const idx = d.membershipPlans.findIndex((x) => x.id === plan.id);
        if (idx >= 0) d.membershipPlans[idx] = data;
      } else {
        d.membershipPlans.push(data);
      }
    }, plan ? 'Đã cập nhật gói hội viên' : 'Đã thêm gói hội viên mới');
    onClose();
  };

  return (
    <Modal
      wide
      title={plan ? `Chỉnh sửa: ${plan.name}` : 'Thêm gói hội viên mới'}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Hủy</button>
          <button className="btn primary" onClick={handleSave} id="save-ms-plan">Lưu gói tập</button>
        </>
      }
    >
      <div className="form-grid">
        <div className="field">
          <label>Tên gói *</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Gói VIP 12 tháng" id="plan-name" />
        </div>
        <div className="field">
          <label>Giá (VNĐ) *</label>
          <input className="input" type="number" step="50000" value={price} onChange={(e) => setPrice(+e.target.value)} id="plan-price" />
        </div>
        <div className="field">
          <label>Thời hạn (tháng) *</label>
          <input className="input" type="number" min={1} value={durationMonths} onChange={(e) => setDurationMonths(+e.target.value)} />
        </div>
        <div className="field">
          <label>Cấp độ ưu tiên Waitlist (1: Thấp, 3: VIP) *</label>
          <select className="input" value={priority} onChange={(e) => setPriority(+e.target.value)}>
            <option value={1}>Cấp 1 (Gói Basic)</option>
            <option value={2}>Cấp 2 (Gói Tiêu chuẩn)</option>
            <option value={3}>Cấp 3 (Gói VIP - Ưu tiên hàng đầu)</option>
          </select>
        </div>
        <div className="field">
          <label>Số buổi PT tặng kèm (miễn phí)</label>
          <input className="input" type="number" min={0} value={freePTSessions} onChange={(e) => setFreePTSessions(+e.target.value)} />
        </div>
        <div className="field">
          <label>Giới hạn lớp học / tuần (0 = Không giới hạn)</label>
          <input className="input" type="number" min={0} value={classBookingsPerWeek} onChange={(e) => setClassBookingsPerWeek(+e.target.value)} />
        </div>
        <div className="field">
          <label>Số lần Freeze tối đa</label>
          <input className="input" type="number" min={0} value={maxFreezeTimes} onChange={(e) => setMaxFreezeTimes(+e.target.value)} />
        </div>
        <div className="field">
          <label>Tổng số ngày Freeze tối đa</label>
          <input className="input" type="number" min={0} value={maxFreezeDays} onChange={(e) => setMaxFreezeDays(+e.target.value)} />
        </div>
        <div className="field full">
          <label>Màu đại diện gói</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: 80, height: 38, border: 'none', background: 'transparent', cursor: 'pointer' }} />
        </div>
        <div className="field full">
          <label>Phạm vi chi nhánh áp dụng</label>
          <div className="row wrap">
            <label className="check">
              <input type="checkbox" checked={scopeAll} onChange={(e) => setScopeAll(e.target.checked)} />
              Áp dụng cho tất cả chi nhánh
            </label>
          </div>
          {!scopeAll && (
            <div className="chips mt8">
              {db.branches.map((b) => {
                const sel = selectedBranches.includes(b.id);
                return (
                  <button
                    key={b.id}
                    className={`chip ${sel ? 'on' : ''}`}
                    onClick={() => setSelectedBranches(sel ? selectedBranches.filter((x) => x !== b.id) : [...selectedBranches, b.id])}
                  >
                    {b.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="field full">
          <label>Mô tả gói tập</label>
          <textarea className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tóm tắt đặc quyền của gói..." />
        </div>
      </div>
    </Modal>
  );
}

function PTPlanModal({ plan, onClose }: { plan: PTPlan | null; onClose: () => void }) {
  const { db, act } = useApp();
  const [name, setName] = useState(plan?.name || '');
  const [sessions, setSessions] = useState(plan?.sessions || 10);
  const [validityDays, setValidityDays] = useState(plan?.validityDays || 60);
  const [price, setPrice] = useState(plan?.price || 3000000);
  const [description, setDescription] = useState(plan?.description || '');
  const [scopeAll, setScopeAll] = useState(plan ? plan.branchScope === 'all' : true);
  const [selectedBranches, setSelectedBranches] = useState<string[]>(
    plan && Array.isArray(plan.branchScope) ? plan.branchScope : [db.branches[0]?.id || '']
  );

  const handleSave = () => {
    act((d) => {
      if (!name.trim()) throw new Error('Vui lòng nhập tên gói PT');
      const branchScope = scopeAll ? 'all' : selectedBranches;
      const data: PTPlan = {
        id: plan ? plan.id : uid('ptp'),
        name: name.trim(),
        sessions,
        validityDays,
        price,
        branchScope,
        description,
        active: plan ? plan.active : true,
      };

      if (plan) {
        const idx = d.ptPlans.findIndex((x) => x.id === plan.id);
        if (idx >= 0) d.ptPlans[idx] = data;
      } else {
        d.ptPlans.push(data);
      }
    }, plan ? 'Đã cập nhật gói PT' : 'Đã thêm gói PT mới');
    onClose();
  };

  return (
    <Modal
      title={plan ? `Chỉnh sửa: ${plan.name}` : 'Thêm gói PT mới'}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Hủy</button>
          <button className="btn primary" onClick={handleSave} id="save-pt-plan">Lưu gói PT</button>
        </>
      }
    >
      <div className="form-grid">
        <div className="field full">
          <label>Tên gói PT *</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: PT 10 buổi cá nhân" id="pt-plan-name" />
        </div>
        <div className="field">
          <label>Số buổi tập *</label>
          <input className="input" type="number" min={1} value={sessions} onChange={(e) => setSessions(+e.target.value)} />
        </div>
        <div className="field">
          <label>Thời hạn sử dụng (ngày) *</label>
          <input className="input" type="number" min={1} value={validityDays} onChange={(e) => setValidityDays(+e.target.value)} />
        </div>
        <div className="field full">
          <label>Giá (VNĐ) *</label>
          <input className="input" type="number" step="50000" value={price} onChange={(e) => setPrice(+e.target.value)} id="pt-plan-price" />
        </div>
        <div className="field full">
          <label>Phạm vi chi nhánh áp dụng</label>
          <div className="row wrap">
            <label className="check">
              <input type="checkbox" checked={scopeAll} onChange={(e) => setScopeAll(e.target.checked)} />
              Áp dụng toàn bộ chi nhánh
            </label>
          </div>
          {!scopeAll && (
            <div className="chips mt8">
              {db.branches.map((b) => {
                const sel = selectedBranches.includes(b.id);
                return (
                  <button
                    key={b.id}
                    className={`chip ${sel ? 'on' : ''}`}
                    onClick={() => setSelectedBranches(sel ? selectedBranches.filter((x) => x !== b.id) : [...selectedBranches, b.id])}
                  >
                    {b.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="field full">
          <label>Mô tả gói PT</label>
          <textarea className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}

export default AdminPlansScreen;
