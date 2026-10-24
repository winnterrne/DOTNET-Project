import { useState } from 'react';
import { Save, KeyRound } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { Avatar, PageHead, Badge } from '../components/ui';
import { roleLabel } from '../components/labels';
import * as L from '../store/logic';

export function AccountPage() {
  const { db, user, act } = useApp();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [pw, setPw] = useState({ old: '', n1: '', n2: '' });

  const branch = user?.branchId ? L.branchById(db, user.branchId) : null;

  const saveProfile = () => {
    act((d) => {
      const u = d.users.find((x) => x.id === user?.id);
      if (u) {
        if (!fullName.trim()) throw new Error('Họ tên không được để trống');
        u.fullName = fullName.trim();
        u.phone = phone.trim();
      }
    }, 'Đã lưu thông tin tài khoản');
  };

  const changePw = () => {
    act((d) => {
      const u = d.users.find((x) => x.id === user?.id);
      if (u) {
        if (u.password !== pw.old) throw new Error('Mật khẩu hiện tại không đúng');
        if (pw.n1.length < 6) throw new Error('Mật khẩu mới tối thiểu 6 ký tự');
        if (pw.n1 !== pw.n2) throw new Error('Xác nhận mật khẩu không khớp');
        u.password = pw.n1;
        setPw({ old: '', n1: '', n2: '' });
      }
    }, 'Đổi mật khẩu thành công');
  };

  if (!user) return null;

  return (
    <>
      <PageHead
        title="Tài khoản cá nhân"
        desc="Quản lý thông tin tài khoản và đổi mật khẩu bảo mật."
      />

      <div className="grid g3">
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Avatar user={user} size="lg" />
          </div>
          <h2 className="mt16">{user.fullName}</h2>
          <div className="small muted">{user.email}</div>
          <div className="mt16">
            <Badge color={roleLabel[user.role][1]}>{roleLabel[user.role][0]}</Badge>
          </div>
          {branch && (
            <div className="small muted mt8">
              Chi nhánh làm việc: <b>{branch.name}</b>
            </div>
          )}
        </div>

        <div className="card span2">
          <div className="card-head">
            <h2>Thông tin cá nhân</h2>
          </div>
          <div className="form-grid">
            <div className="field">
              <label>Họ và tên</label>
              <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="field">
              <label>Email đăng nhập</label>
              <input className="input" value={user.email} disabled />
            </div>
            <div className="field">
              <label>Số điện thoại</label>
              <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            {branch && (
              <div className="field">
                <label>Chi nhánh được gán</label>
                <input className="input" value={branch.name} disabled />
              </div>
            )}
          </div>
          <div className="row mt16" style={{ justifyContent: 'flex-end' }}>
            <button className="btn primary" onClick={saveProfile}>
              <Save size={16} /> Lưu thay đổi
            </button>
          </div>

          <div className="divider" />
          <h3 className="mb16"><KeyRound size={16} style={{ display: 'inline', verticalAlign: 'middle' }} /> Đổi mật khẩu</h3>
          <div className="grid g3" style={{ gap: 12 }}>
            <input
              type="password"
              className="input"
              placeholder="Mật khẩu hiện tại"
              value={pw.old}
              onChange={(e) => setPw({ ...pw, old: e.target.value })}
            />
            <input
              type="password"
              className="input"
              placeholder="Mật khẩu mới"
              value={pw.n1}
              onChange={(e) => setPw({ ...pw, n1: e.target.value })}
            />
            <input
              type="password"
              className="input"
              placeholder="Xác nhận"
              value={pw.n2}
              onChange={(e) => setPw({ ...pw, n2: e.target.value })}
            />
          </div>
          <div className="row mt16" style={{ justifyContent: 'flex-end' }}>
            <button className="btn" onClick={changePw}>
              Cập nhật mật khẩu
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export const ProfileForm = AccountPage;
export const PasswordChange = AccountPage;
