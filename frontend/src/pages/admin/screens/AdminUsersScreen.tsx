import { useState } from 'react';
import {
  UserPlus, Lock, Unlock, Edit2
} from 'lucide-react';
import { useApp } from '../../../store/AppContext';
import * as L from '../../../store/logic';
import { Avatar, Badge, Empty, Modal, PageHead, Tabs } from '../../../components/ui';
import { roleLabel } from '../../../components/labels';
import { fmtDate } from '../../../utils';
import type { User, Role } from '../../../types';

export function AdminUsersScreen() {
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

export default AdminUsersScreen;
