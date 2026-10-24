import { useState } from 'react';
import { Building2, Plus, Edit2, Clock, MapPin } from 'lucide-react';
import { useApp } from '../../../store/AppContext';
import { Badge, Modal, PageHead } from '../../../components/ui';
import { uid } from '../../../utils';
import type { Branch } from '../../../types';

export function AdminBranchesScreen() {
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

export default AdminBranchesScreen;
