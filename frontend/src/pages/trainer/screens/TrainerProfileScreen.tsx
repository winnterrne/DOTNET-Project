import { useState } from 'react';
import { Award, Save } from 'lucide-react';
import { useApp } from '../../../store/AppContext';
import { Avatar, Badge, PageHead } from '../../../components/ui';

export function TrainerProfileScreen() {
  const { db, user, act } = useApp();
  const t = user!.trainer!;
  const [f, setF] = useState({
    fullName: user!.fullName,
    phone: user!.phone,
    bio: t.bio,
    exp: t.experienceYears,
    spec: t.specialties.join(', '),
    cert: t.certifications.join(', '),
    branches: t.branchIds
  });

  const save = () =>
    act((d) => {
      const u = d.users.find((x) => x.id === user!.id)!;
      if (!f.branches.length) throw new Error('Chọn ít nhất một chi nhánh làm việc');
      u.fullName = f.fullName;
      u.phone = f.phone;
      u.trainer = {
        bio: f.bio,
        experienceYears: +f.exp,
        specialties: f.spec.split(',').map((x) => x.trim()).filter(Boolean),
        certifications: f.cert.split(',').map((x) => x.trim()).filter(Boolean),
        branchIds: f.branches
      };
    }, 'Đã cập nhật hồ sơ chuyên môn');

  return (
    <>
      <PageHead title="Hồ sơ chuyên môn" desc="Thông tin hiển thị cho hội viên khi chọn HLV." />
      <div className="grid g3">
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}><Avatar user={user!} size="lg" /></div>
          <h2 className="mt16">{f.fullName}</h2>
          <div className="row wrap mt8" style={{ justifyContent: 'center' }}>{f.spec.split(',').filter((x) => x.trim()).map((x) => <Badge key={x} color="purple" plain>{x.trim()}</Badge>)}</div>
          <div className="row mt16" style={{ justifyContent: 'center' }}><Award size={16} color="#ffc857" /> {f.exp} năm kinh nghiệm</div>
          <p className="small muted mt16">{f.bio}</p>
        </div>
        <div className="card span2">
          <div className="form-grid">
            <div className="field"><label>Họ tên</label><input className="input" value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} /></div>
            <div className="field"><label>Số điện thoại</label><input className="input" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
            <div className="field"><label>Số năm kinh nghiệm</label><input type="number" className="input" value={f.exp} onChange={(e) => setF({ ...f, exp: +e.target.value })} /></div>
            <div className="field"><label>Chuyên môn (phân tách dấu phẩy)</label><input className="input" value={f.spec} onChange={(e) => setF({ ...f, spec: e.target.value })} id="trainer-spec" /></div>
            <div className="field full"><label>Chứng chỉ</label><input className="input" value={f.cert} onChange={(e) => setF({ ...f, cert: e.target.value })} /></div>
            <div className="field full"><label>Giới thiệu</label><textarea className="input" value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} /></div>
            <div className="field full"><label>Chi nhánh làm việc</label><div className="chips">{db.branches.map((b) => <button key={b.id} className={`chip ${f.branches.includes(b.id) ? 'on' : ''}`} onClick={() => setF({ ...f, branches: f.branches.includes(b.id) ? f.branches.filter((x) => x !== b.id) : [...f.branches, b.id] })}>{b.name}</button>)}</div></div>
          </div>
          <div className="row mt16" style={{ justifyContent: 'flex-end' }}><button className="btn primary" onClick={save} id="trainer-save"><Save size={16} /> Lưu hồ sơ</button></div>
        </div>
      </div>
    </>
  );
}

export default TrainerProfileScreen;
