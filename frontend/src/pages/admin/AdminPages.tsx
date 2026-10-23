import { useState } from 'react';
import {
  Users, UserPlus, Lock, Unlock, Building2, Package, CalendarDays, Plus,
  Edit2, Trash2, Calendar, Clock, AlertCircle, Save, Check, X, Shield, MapPin, Sparkles
} from 'lucide-react';
import { useApp } from '../../store/AppContext';
import * as L from '../../store/logic';
import { Avatar, Badge, Empty, Modal, PageHead, Tabs, ConfirmModal } from '../../components/ui';
import { roleLabel } from '../../components/labels';
import { fmtDate, fmtMoney, fmtTime, fmtDateTime, WEEKDAYS, uid } from '../../utils';
import type { User, Role, Branch, MembershipPlan, PTPlan, GroupClass, Settings } from '../../types';

/* ========================================================================== */
/*  1. Quản lý Tài khoản & Phân quyền (AdminUsers)                            */
/* ========================================================================== */
export function AdminUsers() {
  const { db, user: currentUser, act } = useApp();
  const [tab, setTab] = useState<Role | 'all'>('all');
  const [search, setSearch] = useState('');
  const [createModal, setCreateModal] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const filteredUsers = db.users.filter((u) => {
    if (tab !== 'all' && u.role !== tab) return false;
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.phone.includes(term) ||
      (u.cardCode && u.cardCode.toLowerCase().includes(term))
    );
  });

  const toggleLock = (targetUser: User) => {
    if (targetUser.id === currentUser?.id) {
      alert('Không thể tự khóa tài khoản của chính mình!');
      return;
    }
    act((d) => {
      const u = d.users.find((x) => x.id === targetUser.id);
      if (u) {
        u.locked = !u.locked;
        L.notify(
          d,
          u.id,
          u.locked ? 'Tài khoản đã bị khóa' : 'Tài khoản đã được mở khóa',
          u.locked
            ? 'Quản trị viên đã tạm khóa tài khoản của bạn.'
            : 'Tài khoản của bạn đã có thể hoạt động trở lại.',
          u.locked ? 'danger' : 'success'
        );
      }
    }, targetUser.locked ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản');
  };

  return (
    <>
      <PageHead
        title="Quản lý Tài khoản & Phân quyền"
        desc="Quản trị người dùng toàn hệ thống, tạo tài khoản nhân viên/HLV và phân quyền chi nhánh."
        actions={
          <button className="btn primary" onClick={() => setCreateModal(true)} id="btn-add-staff">
            <UserPlus size={16} /> Thêm nhân viên / HLV
          </button>
        }
      />

      <div className="row wrap mb16" style={{ justifyContent: 'space-between', gap: 12 }}>
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'all', label: 'Tất cả', count: db.users.length },
            { id: 'member', label: 'Hội viên', count: db.users.filter((u) => u.role === 'member').length },
            { id: 'trainer', label: 'Huấn luyện viên', count: db.users.filter((u) => u.role === 'trainer').length },
            { id: 'receptionist', label: 'Lễ tân', count: db.users.filter((u) => u.role === 'receptionist').length },
            { id: 'admin', label: 'Quản trị viên', count: db.users.filter((u) => u.role === 'admin').length },
          ]}
        />
        <div className="input-icon" style={{ minWidth: 260 }}>
          <input
            className="input"
            placeholder="Tìm theo tên, email, SĐT, mã thẻ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="search-users"
          />
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Vai trò</th>
              <th>Chi nhánh / Mã thẻ</th>
              <th>Số điện thoại</th>
              <th>Ngày tạo</th>
              <th>Trạng thái</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => {
              const [roleText, roleColor] = roleLabel[u.role];
              const branch = u.branchId ? L.branchById(db, u.branchId) : null;
              return (
                <tr key={u.id}>
                  <td>
                    <div className="row">
                      <Avatar user={u} size="sm" />
                      <div>
                        <b>{u.fullName}</b>
                        <div className="small dim">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Badge color={roleColor}>{roleText}</Badge>
                  </td>
                  <td className="small">
                    {u.role === 'member' ? (
                      <span style={{ fontFamily: 'monospace' }}>{u.cardCode || '—'}</span>
                    ) : u.role === 'receptionist' ? (
                      branch ? branch.name : 'Chưa gán'
                    ) : u.role === 'trainer' ? (
                      u.trainer?.branchIds?.map((b) => L.branchById(db, b)?.name.replace('DFGym ', '')).join(', ') || 'Chưa gán'
                    ) : (
                      'Toàn hệ thống'
                    )}
                  </td>
                  <td className="small">{u.phone || '—'}</td>
                  <td className="small">{fmtDate(u.createdAt)}</td>
                  <td>
                    {u.locked ? (
                      <Badge color="red">Bị khóa</Badge>
                    ) : (
                      <Badge color="green">Hoạt động</Badge>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="row" style={{ justifyContent: 'flex-end', gap: 6 }}>
                      <button
                        className="btn sm ghost"
                        onClick={() => setEditingUser(u)}
                        title="Chỉnh sửa thông tin"
                        id={`edit-user-${u.id}`}
                      >
                        <Edit2 size={14} />
                      </button>
                      {u.id !== currentUser?.id && (
                        <button
                          className={`btn sm ${u.locked ? 'success' : 'danger'}`}
                          onClick={() => toggleLock(u)}
                          id={`lock-user-${u.id}`}
                        >
                          {u.locked ? <><Unlock size={14} /> Mở khóa</> : <><Lock size={14} /> Khóa</>}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredUsers.length === 0 && <Empty text="Không tìm thấy người dùng phù hợp" />}
      </div>

      {createModal && <CreateStaffModal onClose={() => setCreateModal(false)} />}
      {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} />}
    </>
  );
}

function CreateStaffModal({ onClose }: { onClose: () => void }) {
  const { db, act } = useApp();
  const [role, setRole] = useState<'receptionist' | 'trainer' | 'admin'>('receptionist');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [branchId, setBranchId] = useState(db.branches[0]?.id || '');
  const [specialties, setSpecialties] = useState('Gym, HIIT, Cardio');
  const [experienceYears, setExperienceYears] = useState(3);

  const handleSave = () => {
    act((d) => {
      if (!fullName.trim() || !email.trim()) throw new Error('Vui lòng điền đủ họ tên và email');
      L.createStaff(d, {
        role,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        branchId: role === 'receptionist' ? branchId : undefined,
        trainer: role === 'trainer' ? {
          specialties: specialties.split(',').map((s) => s.trim()).filter(Boolean),
          experienceYears,
          certifications: ['Chứng chỉ thể hình Quốc gia'],
          bio: 'Huấn luyện viên chuyên môn cao tại DFGymCenter',
          branchIds: [branchId],
        } : undefined,
      });
    }, 'Tạo tài khoản thành công! Mật khẩu mặc định là 123456');
    onClose();
  };

  return (
    <Modal
      title="Tạo tài khoản nhân viên / HLV"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Hủy</button>
          <button className="btn primary" onClick={handleSave} id="save-staff">Tạo tài khoản</button>
        </>
      }
    >
      <div className="form-grid">
        <div className="field full">
          <label>Vai trò</label>
          <div className="chips">
            <button className={`chip ${role === 'receptionist' ? 'on' : ''}`} onClick={() => setRole('receptionist')}>
              Lễ tân
            </button>
            <button className={`chip ${role === 'trainer' ? 'on' : ''}`} onClick={() => setRole('trainer')}>
              Huấn luyện viên (PT)
            </button>
            <button className={`chip ${role === 'admin' ? 'on' : ''}`} onClick={() => setRole('admin')}>
              Quản trị viên
            </button>
          </div>
        </div>

        <div className="field">
          <label>Họ và tên *</label>
          <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="VD: Lê Thị Mai" id="staff-name" />
        </div>
        <div className="field">
          <label>Email đăng nhập *</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="mail@dfgym.vn" id="staff-email" />
        </div>
        <div className="field">
          <label>Số điện thoại</label>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0901234567" />
        </div>

        {role !== 'admin' && (
          <div className="field">
            <label>{role === 'receptionist' ? 'Chi nhánh làm việc *' : 'Chi nhánh chính *'}</label>
            <select className="input" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              {db.branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}

        {role === 'trainer' && (
          <>
            <div className="field full">
              <label>Chuyên môn (ngăn cách bằng dấu phẩy)</label>
              <input className="input" value={specialties} onChange={(e) => setSpecialties(e.target.value)} placeholder="Tăng cơ, Giảm mỡ, Yoga..." />
            </div>
            <div className="field">
              <label>Số năm kinh nghiệm</label>
              <input className="input" type="number" min={0} value={experienceYears} onChange={(e) => setExperienceYears(+e.target.value)} />
            </div>
          </>
        )}
      </div>
      <p className="small muted mt16">💡 Mật khẩu đăng nhập ban đầu mặc định là <b>123456</b>. Người dùng có thể tự đổi sau khi đăng nhập.</p>
    </Modal>
  );
}

function EditUserModal({ user, onClose }: { user: User; onClose: () => void }) {
  const { db, act } = useApp();
  const [fullName, setFullName] = useState(user.fullName);
  const [phone, setPhone] = useState(user.phone);
  const [branchId, setBranchId] = useState(user.branchId || db.branches[0]?.id || '');

  const handleUpdate = () => {
    act((d) => {
      const u = d.users.find((x) => x.id === user.id);
      if (u) {
        u.fullName = fullName.trim();
        u.phone = phone.trim();
        if (u.role === 'receptionist') u.branchId = branchId;
      }
    }, 'Cập nhật thông tin người dùng thành công');
    onClose();
  };

  return (
    <Modal
      title={`Chỉnh sửa: ${user.fullName}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Hủy</button>
          <button className="btn primary" onClick={handleUpdate} id="save-edit-user">Lưu thay đổi</button>
        </>
      }
    >
      <div className="form-grid">
        <div className="field">
          <label>Họ và tên</label>
          <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="field">
          <label>Email</label>
          <input className="input" value={user.email} disabled />
        </div>
        <div className="field">
          <label>Số điện thoại</label>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        {user.role === 'receptionist' && (
          <div className="field">
            <label>Chi nhánh làm việc</label>
            <select className="input" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              {db.branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ========================================================================== */
/*  2. Quản lý Chi nhánh (AdminBranches)                                      */
/* ========================================================================== */
export function AdminBranches() {
  const { db, act } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [openTime, setOpenTime] = useState('05:30');
  const [closeTime, setCloseTime] = useState('22:00');
  const [rooms, setRooms] = useState('Phòng Yoga, Studio A, Khu PT');

  const openEdit = (b: Branch) => {
    setEditingBranch(b);
    setName(b.name);
    setAddress(b.address);
    setPhone(b.phone);
    setOpenTime(b.openTime);
    setCloseTime(b.closeTime);
    setRooms(b.rooms.join(', '));
    setModalOpen(true);
  };

  const openCreate = () => {
    setEditingBranch(null);
    setName('');
    setAddress('');
    setPhone('');
    setOpenTime('05:30');
    setCloseTime('22:00');
    setRooms('Phòng Yoga, Studio A, Khu PT');
    setModalOpen(true);
  };

  const handleSave = () => {
    act((d) => {
      if (!name.trim()) throw new Error('Vui lòng nhập tên chi nhánh');
      const rList = rooms.split(',').map((r) => r.trim()).filter(Boolean);
      if (editingBranch) {
        const b = d.branches.find((x) => x.id === editingBranch.id);
        if (b) {
          b.name = name.trim();
          b.address = address.trim();
          b.phone = phone.trim();
          b.openTime = openTime;
          b.closeTime = closeTime;
          b.rooms = rList;
        }
      } else {
        const newBranch: Branch = {
          id: uid('br'),
          name: name.trim(),
          address: address.trim(),
          phone: phone.trim(),
          openTime,
          closeTime,
          rooms: rList,
          active: true,
        };
        d.branches.push(newBranch);
      }
    }, editingBranch ? 'Đã cập nhật chi nhánh' : 'Đã thêm chi nhánh mới');
    setModalOpen(false);
  };

  return (
    <>
      <PageHead
        title="Quản lý Chi nhánh"
        desc="Cấu hình danh sách cơ sở, thời gian hoạt động và các phòng chức năng."
        actions={
          <button className="btn primary" onClick={openCreate} id="btn-add-branch">
            <Plus size={16} /> Thêm chi nhánh
          </button>
        }
      />

      <div className="grid g3">
        {db.branches.map((b) => {
          const staffCount = db.users.filter((u) => u.branchId === b.id).length;
          const eqCount = db.equipment.filter((e) => e.branchId === b.id).length;
          const classCount = db.classes.filter((c) => c.branchId === b.id && c.active).length;
          return (
            <div className="card hover" key={b.id}>
              <div className="card-head">
                <div className="row">
                  <Building2 size={20} color="#7c5cff" />
                  <h2>{b.name}</h2>
                </div>
                <button className="btn sm ghost" onClick={() => openEdit(b)} id={`edit-branch-${b.id}`}>
                  <Edit2 size={14} /> Sửa
                </button>
              </div>

              <div className="col small mb16" style={{ gap: 6 }}>
                <div className="row muted"><MapPin size={14} /> {b.address}</div>
                <div className="row muted"><Clock size={14} /> Giờ mở cửa: {b.openTime} – {b.closeTime}</div>
              </div>

              <div className="divider" />
              <div className="small bold mb16" style={{ marginBottom: 6 }}>Phòng chức năng ({b.rooms.length}):</div>
              <div className="chips mb16">
                {b.rooms.map((r) => (
                  <Badge key={r} color="gray" plain>{r}</Badge>
                ))}
              </div>

              <div className="grid g3 pt16" style={{ borderTop: '1px solid var(--border)', textAlign: 'center', paddingTop: 10 }}>
                <div>
                  <div className="bold">{staffCount}</div>
                  <div className="small dim">Nhân viên</div>
                </div>
                <div>
                  <div className="bold">{classCount}</div>
                  <div className="small dim">Lớp học</div>
                </div>
                <div>
                  <div className="bold">{eqCount}</div>
                  <div className="small dim">Thiết bị</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <Modal
          title={editingBranch ? 'Chỉnh sửa chi nhánh' : 'Thêm chi nhánh mới'}
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <button className="btn" onClick={() => setModalOpen(false)}>Hủy</button>
              <button className="btn primary" onClick={handleSave} id="save-branch">Lưu</button>
            </>
          }
        >
          <div className="form-grid">
            <div className="field full">
              <label>Tên chi nhánh *</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: DFGym Cầu Giấy" id="branch-name" />
            </div>
            <div className="field full">
              <label>Địa chỉ *</label>
              <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="VD: 123 Xuân Thủy, Cầu Giấy, Hà Nội" id="branch-address" />
            </div>
            <div className="field">
              <label>Số điện thoại</label>
              <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="024 3888 1111" />
            </div>
            <div className="field">
              <label>Giờ hoạt động (Mở - Đóng)</label>
              <div className="row" style={{ gap: 6 }}>
                <input type="time" className="input" value={openTime} onChange={(e) => setOpenTime(e.target.value)} />
                <span>–</span>
                <input type="time" className="input" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} />
              </div>
            </div>
            <div className="field full">
              <label>Các phòng chức năng (ngăn cách bằng dấu phẩy)</label>
              <textarea className="input" value={rooms} onChange={(e) => setRooms(e.target.value)} placeholder="Phòng Yoga, Phòng Boxing, Studio A, Khu PT" />
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

/* ========================================================================== */
/*  3. Quản lý Danh mục Gói tập (AdminPlans)                                  */
/* ========================================================================== */
export function AdminPlans() {
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

/* ========================================================================== */
/*  4. Quản lý Lớp học Nhóm (AdminClasses)                                    */
/* ========================================================================== */
export function AdminClasses() {
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
          const totalSessions = db.sessions.filter((s) => s.classId === c.id).length;
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
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color }} />
                        <b>{c.name}</b>
                      </div>
                    </td>
                    <td>{fmtDateTime(s.startAt)}</td>
                    <td className="small">{L.branchById(db, c.branchId)?.name} ({s.room})</td>
                    <td className="small">{tr?.fullName}</td>
                    <td>
                      <Badge color={booked >= c.capacity ? 'amber' : 'green'}>
                        {booked}/{c.capacity}
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

/* ========================================================================== */
/*  5. Cấu hình Hệ thống (AdminSettings)                                      */
/* ========================================================================== */
export function AdminSettings() {
  const { db, act } = useApp();
  const [f, setF] = useState<Settings>({ ...db.settings });

  const handleSave = () => {
    act((d) => {
      d.settings = { ...f };
    }, 'Đã lưu cấu hình hệ thống');
  };

  return (
    <>
      <PageHead
        title="Cấu hình Hệ thống"
        desc="Thiết lập các mốc thời gian nhắc lịch, giới hạn hủy và xử lý danh sách chờ tự động."
        actions={
          <button className="btn primary" onClick={handleSave} id="btn-save-settings">
            <Save size={16} /> Lưu cấu hình
          </button>
        }
      />

      <div className="card" style={{ maxWidth: 760 }}>
        <div className="col" style={{ gap: 20 }}>
          <div className="field">
            <label>Thời gian nhắc lịch tập sắp diễn ra (giờ trước buổi tập)</label>
            <input
              type="number"
              min={1}
              max={24}
              className="input"
              value={f.reminderHours}
              onChange={(e) => setF({ ...f, reminderHours: +e.target.value })}
            />
            <span className="small dim">Mặc định 2 giờ. Gửi thông báo đến hội viên và HLV.</span>
          </div>

          <div className="field">
            <label>Thời hạn được hủy lịch hoàn trả lượt/buổi (giờ trước buổi tập)</label>
            <input
              type="number"
              min={1}
              max={48}
              className="input"
              value={f.cancelDeadlineHours}
              onChange={(e) => setF({ ...f, cancelDeadlineHours: +e.target.value })}
            />
            <span className="small dim">Mặc định 4 giờ. Hủy sau mốc này sẽ bị tính lượt (late cancelled).</span>
          </div>

          <div className="field">
            <label>Mốc hết hạn Danh sách chờ (Waitlist Cutoff) (giờ trước buổi tập)</label>
            <input
              type="number"
              min={1}
              max={24}
              className="input"
              value={f.waitlistCutoffHours}
              onChange={(e) => setF({ ...f, waitlistCutoffHours: +e.target.value })}
            />
            <span className="small dim">Theo nghiệp vụ: Khoảng 8 tiếng trước giờ học, nếu hội viên trong hàng chờ vẫn chưa được xếp chỗ thì thông báo lớp đã đầy và yêu cầu chọn lịch khác.</span>
          </div>

          <div className="field">
            <label>Cảnh báo gói hội viên / gói PT sắp hết hạn (ngày trước hạn)</label>
            <input
              type="number"
              min={1}
              max={30}
              className="input"
              value={f.expiryWarningDays}
              onChange={(e) => setF({ ...f, expiryWarningDays: +e.target.value })}
            />
            <span className="small dim">Gửi nhắc nhở gia hạn khi gói còn dưới số ngày này (mặc định 7 ngày).</span>
          </div>

          <div className="field">
            <label>Cảnh báo gói PT sắp hết số buổi</label>
            <input
              type="number"
              min={1}
              max={5}
              className="input"
              value={f.ptLowSessions}
              onChange={(e) => setF({ ...f, ptLowSessions: +e.target.value })}
            />
            <span className="small dim">Gửi thông báo khi gói PT còn dưới số buổi này (mặc định 2 buổi).</span>
          </div>
        </div>
      </div>
    </>
  );
}
