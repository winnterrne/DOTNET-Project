import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import {
  Save, Plus, Scale, Ruler, Percent, Dumbbell, Activity, Receipt, Wrench, QrCode, MapPin, Clock, Trash2, Wifi,
  Sparkles, Utensils, Apple, Flame, Droplets, Target, ChevronRight, Info, Eye, CheckCircle2, TrendingUp, TrendingDown,
  Printer, Copy, Check, History,
} from 'lucide-react';
import { useApp } from '../../store/AppContext';
import * as L from '../../store/logic';
import { Avatar, Badge, Empty, Modal, PageHead, StatCard, FakeQR, Tabs } from '../../components/ui';
import { mStatusLabel, methodLabel, reportLabel, eqLabel } from '../../components/labels';
import { fmtDate, fmtDateTime, fmtMoney, todayStr, calcBMI, bmiLabel, uid as genId, fmtTime } from '../../utils';
import type { User, BodyMetric } from '../../types';

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

/* ================= Tiến độ & AI Dinh Dưỡng ================= */
export function MemberProgress() {
  const { db, user, act } = useApp();
  const [activeTab, setActiveTab] = useState<'progress' | 'nutrition'>('progress');
  const [openAddModal, setOpenAddModal] = useState(false);
  const [inspectedMetric, setInspectedMetric] = useState<BodyMetric | null>(null);
  const [metricKey, setMetricKey] = useState<'weight' | 'bodyFat' | 'muscleMass' | 'bmi' | 'waist' | 'chest' | 'hips'>('weight');

  const list = useMemo(() => {
    return db.bodyMetrics
      .filter((m) => m.memberId === user!.id)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [db.bodyMetrics, user]);

  const first = list[0];
  const last = list.at(-1);

  const delta = (k: keyof BodyMetric) => {
    if (!first || !last) return 0;
    const v1 = first[k] as number | undefined;
    const v2 = last[k] as number | undefined;
    return v1 != null && v2 != null ? +(v2 - v1).toFixed(1) : 0;
  };

  const meta = {
    weight: { label: 'Cân nặng (kg)', color: '#a78bfa' },
    bmi: { label: 'Chỉ số BMI', color: '#ffb020' },
    bodyFat: { label: 'Tỷ lệ mỡ (%)', color: '#ff5c8a' },
    muscleMass: { label: 'Khối lượng cơ (kg)', color: '#00d1b2' },
    waist: { label: 'Vòng eo (cm)', color: '#38bdf8' },
    chest: { label: 'Vòng ngực (cm)', color: '#fb923c' },
    hips: { label: 'Vòng mông (cm)', color: '#e879f9' },
  };

  // Tính tuổi hội viên từ ngày sinh
  const userAge = useMemo(() => {
    if (!user?.dob) return 25;
    const birth = new Date(user.dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) {
      age--;
    }
    return age > 0 ? age : 25;
  }, [user]);

  return (
    <>
      <PageHead
        title="Tiến độ, Chỉ số cơ thể & AI Dinh dưỡng"
        desc={
          first
            ? `Bắt đầu từ ${fmtDate(first.date)} · Đã thực hiện ${list.length} lần đo kiểm tra thể hình.`
            : 'Ghi nhận mốc đo đầu tiên để theo dõi lộ trình thay đổi vóc dáng và nhận thực đơn dinh dưỡng chuẩn.'
        }
        actions={
          <div className="row" style={{ gap: 10 }}>
            <button
              className="btn primary"
              onClick={() => setOpenAddModal(true)}
              id="add-metric"
            >
              <Plus size={16} /> Ghi nhận mốc đo mới
            </button>
          </div>
        }
      />

      {/* TABS CHUYỂN ĐỔI: TIẾN ĐỘ & BIỂU ĐỒ vs AI DINH DƯỠNG */}
      <div className="chips mb16">
        <button
          className={`chip ${activeTab === 'progress' ? 'on' : ''}`}
          onClick={() => setActiveTab('progress')}
          style={{ padding: '8px 18px', fontSize: 14 }}
        >
          <Activity size={16} style={{ marginRight: 6 }} /> 1. Biểu đồ tiến độ & Mốc đo lịch sử ({list.length})
        </button>
        <button
          className={`chip ${activeTab === 'nutrition' ? 'on' : ''}`}
          onClick={() => setActiveTab('nutrition')}
          style={{ padding: '8px 18px', fontSize: 14 }}
        >
          <Sparkles size={16} style={{ marginRight: 6, color: '#ffb020' }} /> 2. AI Gợi ý chế độ dinh dưỡng
        </button>
      </div>

      {activeTab === 'progress' ? (
        !last ? (
          <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <Empty
              text="Chưa có mốc đo nào được lưu. Hãy bấm 'Ghi nhận mốc đo mới' để bắt đầu vẽ biểu đồ tiến độ!"
              icon={<Activity size={48} />}
            />
            <button
              className="btn primary mt16"
              onClick={() => setOpenAddModal(true)}
            >
              <Plus size={16} /> Nhập số đo ban đầu
            </button>
          </div>
        ) : (
          <>
            {/* THẺ THỐNG KÊ NHANH CÁC CHỈ SỐ QUAN TRỌNG */}
            <div className="grid g4 mb16">
              <StatCard
                icon={<Scale size={22} />}
                label="Cân nặng hiện tại"
                value={`${last.weight} kg`}
                color="#a78bfa"
                trend={list.length > 1 ? { v: `${delta('weight') > 0 ? '+' : ''}${delta('weight')} kg`, up: delta('weight') <= 0 } : undefined}
              />
              <StatCard
                icon={<Ruler size={22} />}
                label={`BMI · ${bmiLabel(last.bmi)}`}
                value={last.bmi}
                color="#ffb020"
                trend={list.length > 1 ? { v: `${delta('bmi') > 0 ? '+' : ''}${delta('bmi')}`, up: delta('bmi') <= 0 } : undefined}
              />
              <StatCard
                icon={<Percent size={22} />}
                label="Tỷ lệ mỡ"
                value={last.bodyFat != null ? `${last.bodyFat}%` : '—'}
                color="#ff5c8a"
                trend={list.length > 1 && last.bodyFat != null ? { v: `${delta('bodyFat') > 0 ? '+' : ''}${delta('bodyFat')}%`, up: delta('bodyFat') <= 0 } : undefined}
              />
              <StatCard
                icon={<Dumbbell size={22} />}
                label="Khối lượng cơ"
                value={last.muscleMass != null ? `${last.muscleMass} kg` : '—'}
                color="#00d1b2"
                trend={list.length > 1 && last.muscleMass != null ? { v: `${delta('muscleMass') > 0 ? '+' : ''}${delta('muscleMass')} kg`, up: delta('muscleMass') >= 0 } : undefined}
              />
            </div>

            {/* KHỐI BIỂU ĐỒ TƯƠNG TÁC */}
            <div className="card mb16">
              <div className="card-head between wrap" style={{ gap: 12 }}>
                <div>
                  <h2><Activity size={18} /> Biểu đồ theo dõi tiến độ cơ thể</h2>
                  <span className="small muted">
                    Bấm vào từng điểm mốc trên biểu đồ để xem chi tiết so sánh và đánh giá thể trạng
                  </span>
                </div>

                {/* Danh sách chỉ số có thể chọn xem trên biểu đồ */}
                <div className="chips">
                  {(Object.keys(meta) as (keyof typeof meta)[]).map((k) => (
                    <button
                      key={k}
                      className={`chip ${metricKey === k ? 'on' : ''}`}
                      onClick={() => setMetricKey(k)}
                    >
                      {meta[k].label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ height: 340, width: '100%', marginTop: 8 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={list.map((m, idx) => ({
                      ...m,
                      d: `${fmtDate(m.date).slice(0, 5)} (Lần ${idx + 1})`,
                    }))}
                    onClick={(state: any) => {
                      if (state && state.activePayload && state.activePayload[0]) {
                        const m = list.find((x) => x.id === state.activePayload[0].payload.id);
                        if (m) setInspectedMetric(m);
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="d" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-dim)', fontSize: 12 }} />
                    <YAxis domain={['dataMin - 1', 'dataMax + 1']} axisLine={false} tickLine={false} width={45} tick={{ fill: 'var(--text-dim)', fontSize: 12 }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as BodyMetric;
                          return (
                            <div className="card" style={{ padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                              <div className="bold mb4" style={{ color: 'var(--primary)' }}>
                                📅 Ngày đo: {fmtDate(data.date)}
                              </div>
                              <div className="small">Cân nặng: <b>{data.weight} kg</b></div>
                              <div className="small">BMI: <b>{data.bmi}</b> ({bmiLabel(data.bmi)})</div>
                              {data.bodyFat != null && <div className="small">Mỡ: <b>{data.bodyFat}%</b></div>}
                              {data.muscleMass != null && <div className="small">Cơ: <b>{data.muscleMass} kg</b></div>}
                              {data.waist != null && <div className="small">Vòng eo: <b>{data.waist} cm</b></div>}
                              <div className="small dim mt8" style={{ color: 'var(--primary)' }}>👉 Bấm vào điểm này để xem chi tiết mốc đo</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey={metricKey}
                      name={meta[metricKey].label}
                      stroke={meta[metricKey].color}
                      strokeWidth={3}
                      dot={{ r: 6, fill: meta[metricKey].color, strokeWidth: 2, stroke: 'var(--surface)' }}
                      activeDot={{ r: 9, stroke: '#fff', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="row between small muted mt12" style={{ padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 8 }}>
                <span>💡 <b>Mẹo xem mốc:</b> Bấm chuột trực tiếp vào các chấm tròn trên đường biểu đồ để mở cửa sổ so sánh chi tiết.</span>
                <span className="bold">{list.length} mốc đo đã lưu</span>
              </div>
            </div>

            {/* BẢNG LỊCH SỬ TỪNG MỐC ĐO */}
            <div className="card">
              <div className="card-head between">
                <div>
                  <h2><History size={18} /> Lịch sử chi tiết các mốc đo ({list.length})</h2>
                  <span className="small muted">Xem lại lịch sử, so sánh độ thay đổi thể hình và ghi chú</span>
                </div>
                <button className="btn sm" onClick={() => setOpenAddModal(true)}>
                  <Plus size={15} /> Thêm số đo
                </button>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Ngày đo</th>
                      <th>Cân nặng</th>
                      <th>Chiều cao</th>
                      <th>BMI</th>
                      <th>% Mỡ</th>
                      <th>Cơ nạc</th>
                      <th>3 vòng (Ngực/Eo/Mông)</th>
                      <th>Ghi chú</th>
                      <th style={{ textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...list].reverse().map((m, idx) => {
                      const isFirst = m.id === first!.id;
                      const isLatest = m.id === last!.id;
                      return (
                        <tr key={m.id} style={{ cursor: 'pointer' }} onClick={() => setInspectedMetric(m)}>
                          <td>
                            <div className="row" style={{ gap: 6 }}>
                              <b>{fmtDate(m.date)}</b>
                              {isLatest && <Badge color="green">Mới nhất</Badge>}
                              {isFirst && <Badge color="purple" plain>Ban đầu</Badge>}
                            </div>
                          </td>
                          <td><b>{m.weight}</b> kg</td>
                          <td>{m.height} cm</td>
                          <td>
                            <Badge color={m.bmi >= 18.5 && m.bmi <= 23 ? 'green' : m.bmi > 25 ? 'red' : 'amber'}>
                              {m.bmi} · {bmiLabel(m.bmi)}
                            </Badge>
                          </td>
                          <td>{m.bodyFat != null ? `${m.bodyFat}%` : '—'}</td>
                          <td>{m.muscleMass != null ? `${m.muscleMass} kg` : '—'}</td>
                          <td className="small">
                            {m.chest || m.waist || m.hips ? (
                              <span>
                                {m.chest ?? '—'} / <b>{m.waist ?? '—'}</b> / {m.hips ?? '—'} cm
                              </span>
                            ) : (
                              <span className="dim">—</span>
                            )}
                          </td>
                          <td className="small muted truncate" style={{ maxWidth: 160 }}>
                            {m.note || '—'}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="row" style={{ justifyContent: 'flex-end', gap: 6 }}>
                              <button
                                className="btn sm ghost"
                                title="Xem phân tích chi tiết mốc này"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setInspectedMetric(m);
                                }}
                              >
                                <Eye size={15} /> Xem
                              </button>
                              <button
                                className="btn sm ghost"
                                title="Xóa bản ghi này"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  act((d) => {
                                    d.bodyMetrics = d.bodyMetrics.filter((x) => x.id !== m.id);
                                  }, 'Đã xóa bản ghi mốc đo');
                                }}
                              >
                                <Trash2 size={15} color="var(--red)" />
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
          </>
        )
      ) : (
        /* TAB 2: AI GỢI Ý CHẾ ĐỘ DINH DƯỠNG (NUTRITION ADVISOR) */
        <NutritionAdvisor
          user={user!}
          defaultWeight={last?.weight ?? 65}
          defaultHeight={last?.height ?? 170}
          defaultBodyFat={last?.bodyFat ?? 20}
          defaultAge={userAge}
        />
      )}

      {/* MODAL THÊM CHỈ SỐ MỚI */}
      {openAddModal && (
        <MetricModal
          lastHeight={last?.height}
          lastWeight={last?.weight}
          onClose={() => setOpenAddModal(false)}
        />
      )}

      {/* MODAL XEM CHI TIẾT & SO SÁNH MỐC ĐO LỊCH SỬ */}
      {inspectedMetric && (
        <CheckpointDetailModal
          checkpoint={inspectedMetric}
          baseline={first!}
          allMetrics={list}
          onClose={() => setInspectedMetric(null)}
        />
      )}
    </>
  );
}

/* ================= MODAL XEM CHI TIẾT & SO SÁNH MỐC ĐO ================= */
function CheckpointDetailModal({
  checkpoint,
  baseline,
  allMetrics,
  onClose,
}: {
  checkpoint: BodyMetric;
  baseline: BodyMetric;
  allMetrics: BodyMetric[];
  onClose: () => void;
}) {
  const currentIndex = allMetrics.findIndex((m) => m.id === checkpoint.id);
  const prevCheckpoint = currentIndex > 0 ? allMetrics[currentIndex - 1] : null;

  // Tính delta so với mốc ban đầu (Baseline)
  const deltaBase = (key: keyof BodyMetric) => {
    const vNow = checkpoint[key] as number | undefined;
    const vBase = baseline[key] as number | undefined;
    if (vNow == null || vBase == null) return null;
    return +(vNow - vBase).toFixed(1);
  };

  // Tính delta so với mốc liền trước (Previous)
  const deltaPrev = (key: keyof BodyMetric) => {
    if (!prevCheckpoint) return null;
    const vNow = checkpoint[key] as number | undefined;
    const vPrev = prevCheckpoint[key] as number | undefined;
    if (vNow == null || vPrev == null) return null;
    return +(vNow - vPrev).toFixed(1);
  };

  const weightDeltaBase = deltaBase('weight');
  const fatDeltaBase = deltaBase('bodyFat');
  const muscleDeltaBase = deltaBase('muscleMass');

  return (
    <Modal
      title={`Chi tiết mốc đo: ${fmtDate(checkpoint.date)}`}
      onClose={onClose}
      footer={<button className="btn primary" onClick={onClose}>Đóng</button>}
    >
      <div className="col" style={{ gap: 16 }}>
        {/* THÔNG TIN CHUNG MỐC ĐO */}
        <div className="card" style={{ background: 'var(--surface-2)', padding: 14 }}>
          <div className="row between wrap" style={{ gap: 8 }}>
            <div>
              <span className="small muted">Mốc đo thứ {currentIndex + 1} / {allMetrics.length}</span>
              <h3 style={{ fontSize: 18, marginTop: 2 }}>{fmtDate(checkpoint.date)}</h3>
            </div>
            <div className="row" style={{ gap: 6 }}>
              {checkpoint.id === baseline.id ? (
                <Badge color="purple">Mốc ban đầu (Baseline)</Badge>
              ) : currentIndex === allMetrics.length - 1 ? (
                <Badge color="green">Mốc mới nhất</Badge>
              ) : (
                <Badge color="blue">Mốc giữa kỳ</Badge>
              )}
            </div>
          </div>
          {checkpoint.note && (
            <div className="small muted mt8" style={{ fontStyle: 'italic', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
              💬 Ghi chú: "{checkpoint.note}"
            </div>
          )}
        </div>

        {/* BẢNG SO SÁNH CHỈ SỐ: HIỆN TẠI VS BAN ĐẦU VS LẦN ĐO TRƯỚC */}
        <div>
          <h4 className="mb8" style={{ fontSize: 14 }}>📊 Bảng so sánh các chỉ số</h4>
          <div className="table-wrap">
            <table style={{ fontSize: 13 }}>
              <thead>
                <tr>
                  <th>Chỉ số</th>
                  <th>Giá trị mốc này</th>
                  <th>So với lần trước</th>
                  <th>So với ban đầu</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><b>Cân nặng</b></td>
                  <td><b>{checkpoint.weight} kg</b></td>
                  <td>
                    {deltaPrev('weight') != null ? (
                      <span style={{ color: deltaPrev('weight')! <= 0 ? 'var(--green)' : 'var(--amber)', fontWeight: 600 }}>
                        {deltaPrev('weight')! > 0 ? `+${deltaPrev('weight')}` : deltaPrev('weight')} kg
                      </span>
                    ) : '—'}
                  </td>
                  <td>
                    {weightDeltaBase != null ? (
                      <span style={{ color: weightDeltaBase <= 0 ? 'var(--green)' : 'var(--amber)', fontWeight: 700 }}>
                        {weightDeltaBase > 0 ? `+${weightDeltaBase}` : weightDeltaBase} kg
                      </span>
                    ) : '—'}
                  </td>
                </tr>

                <tr>
                  <td><b>BMI</b></td>
                  <td><b>{checkpoint.bmi}</b> ({bmiLabel(checkpoint.bmi)})</td>
                  <td>
                    {deltaPrev('bmi') != null ? (
                      <span>{deltaPrev('bmi')! > 0 ? `+${deltaPrev('bmi')}` : deltaPrev('bmi')}</span>
                    ) : '—'}
                  </td>
                  <td>
                    {deltaBase('bmi') != null ? (
                      <span style={{ fontWeight: 600 }}>{deltaBase('bmi')! > 0 ? `+${deltaBase('bmi')}` : deltaBase('bmi')}</span>
                    ) : '—'}
                  </td>
                </tr>

                <tr>
                  <td><b>Tỷ lệ mỡ (%)</b></td>
                  <td>{checkpoint.bodyFat != null ? `${checkpoint.bodyFat}%` : '—'}</td>
                  <td>
                    {deltaPrev('bodyFat') != null ? (
                      <span style={{ color: deltaPrev('bodyFat')! <= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                        {deltaPrev('bodyFat')! > 0 ? `+${deltaPrev('bodyFat')}` : deltaPrev('bodyFat')}%
                      </span>
                    ) : '—'}
                  </td>
                  <td>
                    {fatDeltaBase != null ? (
                      <span style={{ color: fatDeltaBase <= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
                        {fatDeltaBase > 0 ? `+${fatDeltaBase}` : fatDeltaBase}%
                      </span>
                    ) : '—'}
                  </td>
                </tr>

                <tr>
                  <td><b>Khối lượng cơ</b></td>
                  <td>{checkpoint.muscleMass != null ? `${checkpoint.muscleMass} kg` : '—'}</td>
                  <td>
                    {deltaPrev('muscleMass') != null ? (
                      <span style={{ color: deltaPrev('muscleMass')! >= 0 ? 'var(--green)' : 'var(--amber)', fontWeight: 600 }}>
                        {deltaPrev('muscleMass')! > 0 ? `+${deltaPrev('muscleMass')}` : deltaPrev('muscleMass')} kg
                      </span>
                    ) : '—'}
                  </td>
                  <td>
                    {muscleDeltaBase != null ? (
                      <span style={{ color: muscleDeltaBase >= 0 ? 'var(--green)' : 'var(--amber)', fontWeight: 700 }}>
                        {muscleDeltaBase > 0 ? `+${muscleDeltaBase}` : muscleDeltaBase} kg
                      </span>
                    ) : '—'}
                  </td>
                </tr>

                {(checkpoint.waist != null || baseline.waist != null) && (
                  <tr>
                    <td><b>Vòng eo</b></td>
                    <td>{checkpoint.waist != null ? `${checkpoint.waist} cm` : '—'}</td>
                    <td>
                      {deltaPrev('waist') != null ? (
                        <span>{deltaPrev('waist')! > 0 ? `+${deltaPrev('waist')}` : deltaPrev('waist')} cm</span>
                      ) : '—'}
                    </td>
                    <td>
                      {deltaBase('waist') != null ? (
                        <span style={{ fontWeight: 600 }}>{deltaBase('waist')! > 0 ? `+${deltaBase('waist')}` : deltaBase('waist')} cm</span>
                      ) : '—'}
                    </td>
                  </tr>
                )}

                {(checkpoint.chest != null || baseline.chest != null) && (
                  <tr>
                    <td><b>Vòng ngực</b></td>
                    <td>{checkpoint.chest != null ? `${checkpoint.chest} cm` : '—'}</td>
                    <td>
                      {deltaPrev('chest') != null ? (
                        <span>{deltaPrev('chest')! > 0 ? `+${deltaPrev('chest')}` : deltaPrev('chest')} cm</span>
                      ) : '—'}
                    </td>
                    <td>
                      {deltaBase('chest') != null ? (
                        <span style={{ fontWeight: 600 }}>{deltaBase('chest')! > 0 ? `+${deltaBase('chest')}` : deltaBase('chest')} cm</span>
                      ) : '—'}
                    </td>
                  </tr>
                )}

                {(checkpoint.hips != null || baseline.hips != null) && (
                  <tr>
                    <td><b>Vòng mông</b></td>
                    <td>{checkpoint.hips != null ? `${checkpoint.hips} cm` : '—'}</td>
                    <td>
                      {deltaPrev('hips') != null ? (
                        <span>{deltaPrev('hips')! > 0 ? `+${deltaPrev('hips')}` : deltaPrev('hips')} cm</span>
                      ) : '—'}
                    </td>
                    <td>
                      {deltaBase('hips') != null ? (
                        <span style={{ fontWeight: 600 }}>{deltaBase('hips')! > 0 ? `+${deltaBase('hips')}` : deltaBase('hips')} cm</span>
                      ) : '—'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* NHẬN XÉT TIẾN ĐỘ THỂ HÌNH */}
        <div className="card" style={{ background: 'rgba(124, 92, 255, 0.08)', borderColor: 'rgba(124, 92, 255, 0.3)', padding: 14 }}>
          <div className="row" style={{ gap: 8, alignItems: 'center', marginBottom: 6 }}>
            <Sparkles size={16} color="var(--primary)" />
            <span className="bold">Đánh giá tiến độ từ hệ thống DFGym:</span>
          </div>
          <p className="small muted" style={{ lineHeight: 1.5 }}>
            {weightDeltaBase != null && weightDeltaBase < 0 && muscleDeltaBase != null && muscleDeltaBase >= 0
              ? '🎉 Tuyệt vời! Bạn đang giảm mỡ đồng thời bảo toàn/tăng khối lượng cơ nạc. Đây là trạng thái Body Recomposition lý tưởng nhất.'
              : weightDeltaBase != null && weightDeltaBase < 0
              ? '👍 Bạn đang giảm cân ổn định. Tiếp tục duy trì lượng Protein để bảo toàn cơ bắp nhé.'
              : muscleDeltaBase != null && muscleDeltaBase > 0
              ? '💪 Bạn đang tăng trưởng khối lượng cơ bắp hiệu quả. Hãy duy trì thặng dư calo vừa phải.'
              : '🌟 Cơ thể đang duy trì trạng thái ổn định. Bạn có thể điều chỉnh chế độ dinh dưỡng với AI tab bên cạnh để bứt phá mục tiêu.'}
          </p>
        </div>
      </div>
    </Modal>
  );
}

/* ================= MODAL NHẬP MỐC ĐO CHỈ SỐ MỚI ================= */
function MetricModal({
  lastHeight,
  lastWeight,
  onClose,
}: {
  lastHeight?: number;
  lastWeight?: number;
  onClose: () => void;
}) {
  const { user, act } = useApp();
  const [f, setF] = useState({
    date: todayStr(),
    weight: String(lastWeight ?? ''),
    height: String(lastHeight ?? ''),
    bodyFat: '',
    muscleMass: '',
    chest: '',
    waist: '',
    hips: '',
    note: '',
  });

  const bmi = calcBMI(+f.weight, +f.height);

  const save = () => {
    const r = act((d) => {
      if (!+f.weight || !+f.height) throw new Error('Vui lòng nhập cân nặng và chiều cao hợp lệ');
      d.bodyMetrics.push({
        id: genId('bm'),
        memberId: user!.id,
        date: f.date,
        weight: +f.weight,
        height: +f.height,
        bmi,
        bodyFat: f.bodyFat ? +f.bodyFat : undefined,
        muscleMass: f.muscleMass ? +f.muscleMass : undefined,
        chest: f.chest ? +f.chest : undefined,
        waist: f.waist ? +f.waist : undefined,
        hips: f.hips ? +f.hips : undefined,
        note: f.note,
      });
      return true;
    }, 'Đã lưu mốc đo chỉ số cơ thể');
    if (r) onClose();
  };

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <Modal
      title="Ghi nhận mốc đo cơ thể mới"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Hủy</button>
          <button className="btn primary" onClick={save} id="metric-save">
            <Save size={15} /> Lưu chỉ số & Cập nhật biểu đồ
          </button>
        </>
      }
    >
      <div className="col" style={{ gap: 14 }}>
        <div className="form-grid">
          <div className="field">
            <label>Ngày đo *</label>
            <input type="date" className="input" value={f.date} max={todayStr()} onChange={set('date')} />
          </div>

          <div className="field">
            <label>Cân nặng (kg) *</label>
            <input
              type="number"
              step="0.1"
              className="input"
              placeholder="VD: 68.5"
              value={f.weight}
              onChange={set('weight')}
              id="metric-weight"
            />
          </div>

          <div className="field">
            <label>Chiều cao (cm) *</label>
            <input
              type="number"
              className="input"
              placeholder="VD: 172"
              value={f.height}
              onChange={set('height')}
              id="metric-height"
            />
          </div>

          <div className="field">
            <label>BMI (tự tính tự động)</label>
            <input
              className="input"
              value={bmi ? `${bmi} · ${bmiLabel(bmi)}` : 'Chờ nhập cân nặng & chiều cao'}
              disabled
              style={{ fontWeight: 600, color: 'var(--primary)' }}
            />
          </div>

          <div className="field">
            <label>Tỷ lệ mỡ cơ thể (%)</label>
            <input
              type="number"
              step="0.1"
              className="input"
              placeholder="VD: 18.2"
              value={f.bodyFat}
              onChange={set('bodyFat')}
            />
          </div>

          <div className="field">
            <label>Khối lượng cơ (kg)</label>
            <input
              type="number"
              step="0.1"
              className="input"
              placeholder="VD: 31.5"
              value={f.muscleMass}
              onChange={set('muscleMass')}
            />
          </div>
        </div>

        {/* CÁC SỐ ĐO VÒNG (OPTIONAL ĐỂ VẼ BIỂU ĐỒ SỐ ĐO 3 VÒNG) */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
          <div className="small bold muted mb8">Số đo 3 vòng (cm) - Tùy chọn để theo dõi dáng</div>
          <div className="grid g3" style={{ gap: 10 }}>
            <div className="field">
              <label className="small">Vòng 1 - Ngực (cm)</label>
              <input type="number" step="0.5" className="input" placeholder="VD: 95" value={f.chest} onChange={set('chest')} />
            </div>
            <div className="field">
              <label className="small">Vòng 2 - Eo (cm)</label>
              <input type="number" step="0.5" className="input" placeholder="VD: 76" value={f.waist} onChange={set('waist')} />
            </div>
            <div className="field">
              <label className="small">Vòng 3 - Mông (cm)</label>
              <input type="number" step="0.5" className="input" placeholder="VD: 94" value={f.hips} onChange={set('hips')} />
            </div>
          </div>
        </div>

        <div className="field">
          <label>Ghi chú mốc đo</label>
          <input
            className="input"
            placeholder="VD: Đo buổi sáng sau khi ngủ dậy, sau 1 tháng tập giáo án mới..."
            value={f.note}
            onChange={set('note')}
          />
        </div>
      </div>
    </Modal>
  );
}

/* ================= COMPONENT AI GỢI Ý CHẾ ĐỘ DINH DƯỠNG ================= */
function NutritionAdvisor({
  user,
  defaultWeight,
  defaultHeight,
  defaultBodyFat,
  defaultAge,
}: {
  user: User;
  defaultWeight: number;
  defaultHeight: number;
  defaultBodyFat: number;
  defaultAge: number;
}) {
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(user.gender || 'male');
  const [age, setAge] = useState<number>(defaultAge);
  const [weight, setWeight] = useState<number>(defaultWeight);
  const [height, setHeight] = useState<number>(defaultHeight);
  const [bodyFat, setBodyFat] = useState<number>(defaultBodyFat);
  const [copied, setCopied] = useState(false);

  const [goal, setGoal] = useState<'lose_fat' | 'build_muscle' | 'maintain' | 'endurance'>('lose_fat');
  const [activityLevel, setActivityLevel] = useState<'sedentary' | 'light' | 'moderate' | 'high'>('moderate');
  const [dietStyle, setDietStyle] = useState<'eat_clean' | 'high_protein' | 'vegetarian' | 'low_carb'>('high_protein');

  // Tính toán kế hoạch dinh dưỡng bằng thuật toán DFGym AI
  const plan = useMemo(() => {
    return L.calculateNutritionPlan({
      gender,
      age: +age || 25,
      weight: +weight || 65,
      height: +height || 170,
      bodyFat: +bodyFat || undefined,
      goal,
      activityLevel,
      dietStyle,
    });
  }, [gender, age, weight, height, bodyFat, goal, activityLevel, dietStyle]);

  const copyPlan = () => {
    const text = `=== THỰC ĐƠN DINH DƯỠNG DFGym AI ===\n` +
      `Mục tiêu: ${plan.goalLabel}\n` +
      `Calo mục tiêu: ${plan.targetCalories} kcal/ngày (BMR: ${plan.bmr}, TDEE: ${plan.tdee})\n` +
      `Macros: Protein ${plan.macros.protein}g · Carbs ${plan.macros.carbs}g · Fat ${plan.macros.fat}g\n` +
      `Nước uống: ${plan.waterLiters} lít/ngày\n\n` +
      plan.meals.map((m) => `[${m.time}] ${m.name} (${m.calories} kcal):\n- ${m.description}\n- Thực phẩm: ${m.items.join(', ')}`).join('\n\n') +
      `\n\nLời khuyên: \n` + plan.tips.map((t) => `• ${t}`).join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="col" style={{ gap: 18 }}>
      {/* BANNER GIỚI THIỆU AI NUTRITION */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(124, 92, 255, 0.15), rgba(0, 209, 178, 0.12))',
          borderColor: 'rgba(124, 92, 255, 0.35)',
          padding: 20,
        }}
      >
        <div className="row between wrap" style={{ gap: 12 }}>
          <div className="row" style={{ gap: 14 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <Sparkles size={24} />
            </div>
            <div>
              <div className="row" style={{ gap: 8 }}>
                <h2 style={{ fontSize: 18 }}>DFGym AI Nutrition Coach</h2>
                <Badge color="purple">Thuật toán Mifflin-St Jeor Chuẩn Thể Hình</Badge>
              </div>
              <p className="small muted mt4">
                Hệ thống tự động tính toán BMR, TDEE, thâm hụt/thặng dư calo, phân chia tỷ lệ Macros (Protein/Carb/Fat) và gợi ý 5 bữa ăn chi tiết theo thể trạng thực tế của bạn.
              </p>
            </div>
          </div>

          <button className="btn sm ghost" onClick={copyPlan} style={{ gap: 6 }}>
            {copied ? <Check size={15} color="var(--green)" /> : <Copy size={15} />}
            {copied ? 'Đã sao chép thực đơn!' : 'Sao chép thực đơn'}
          </button>
        </div>
      </div>

      {/* BỘ ĐIỀU KHIỂN THỂ TRẠNG & MỤC TIÊU CỦA HỘI VIÊN */}
      <div className="card" style={{ padding: 18 }}>
        <h3 className="mb12" style={{ fontSize: 15 }}>⚙️ Cấu hình thể trạng & Thói quen tập luyện</h3>

        <div className="grid g4 mb16" style={{ gap: 12 }}>
          <div className="field">
            <label className="small">Giới tính</label>
            <select className="input sm" value={gender} onChange={(e) => setGender(e.target.value as any)}>
              <option value="male">Nam giới</option>
              <option value="female">Nữ giới</option>
              <option value="other">Khác</option>
            </select>
          </div>

          <div className="field">
            <label className="small">Tuổi</label>
            <input type="number" className="input sm" value={age} onChange={(e) => setAge(+e.target.value)} />
          </div>

          <div className="field">
            <label className="small">Cân nặng (kg)</label>
            <input type="number" step="0.5" className="input sm" value={weight} onChange={(e) => setWeight(+e.target.value)} />
          </div>

          <div className="field">
            <label className="small">Chiều cao (cm)</label>
            <input type="number" className="input sm" value={height} onChange={(e) => setHeight(+e.target.value)} />
          </div>
        </div>

        <div className="grid g3" style={{ gap: 14 }}>
          {/* MỤC TIÊU THỂ HÌNH */}
          <div className="field">
            <label className="small bold">🎯 Mục tiêu của bạn</label>
            <select className="input sm" value={goal} onChange={(e) => setGoal(e.target.value as any)}>
              <option value="lose_fat">Giảm mỡ & Siết cơ (Fat Loss & Cut -500 kcal)</option>
              <option value="build_muscle">Tăng cơ nạc (Lean Bulking +350 kcal)</option>
              <option value="maintain">Duy trì vóc dáng & Thể lực (Maintenance)</option>
              <option value="endurance">Tăng sức bền & Tim mạch (Endurance +150 kcal)</option>
            </select>
          </div>

          {/* CƯỜNG ĐỘ VẬN ĐỘNG */}
          <div className="field">
            <label className="small bold">⚡ Mức độ vận động / Tuần</label>
            <select className="input sm" value={activityLevel} onChange={(e) => setActivityLevel(e.target.value as any)}>
              <option value="sedentary">Ít vận động (Văn phòng, 1.2x BMR)</option>
              <option value="light">Vận động nhẹ (Tập 1-2 buổi/tuần, 1.375x BMR)</option>
              <option value="moderate">Vừa phải (Tập 3-5 buổi/tuần, 1.55x BMR)</option>
              <option value="high">Cường độ cao (Tập 6-7 buổi/tuần, 1.725x BMR)</option>
            </select>
          </div>

          {/* PHONG CÁCH ẨM THỰC */}
          <div className="field">
            <label className="small bold">🥗 Phong cách ăn uống</label>
            <select className="input sm" value={dietStyle} onChange={(e) => setDietStyle(e.target.value as any)}>
              <option value="high_protein">High Protein (Gymer, tăng cơ giảm mỡ)</option>
              <option value="eat_clean">Eat Clean & Cân bằng (Healthy Lifestyle)</option>
              <option value="low_carb">Low Carb (Hạn chế tinh bột)</option>
              <option value="vegetarian">Ăn chay / Thực vật (Plant-based)</option>
            </select>
          </div>
        </div>
      </div>

      {/* KẾT QUẢ TÍNH TOÁN NĂNG LƯỢNG & MACROS */}
      <div className="grid g4">
        <div className="card" style={{ borderLeft: '4px solid #a78bfa', padding: 16 }}>
          <span className="small muted">BMR (Năng lượng nền)</span>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4, color: '#a78bfa' }}>
            {plan.bmr} <span style={{ fontSize: 13, fontWeight: 500 }}>kcal</span>
          </div>
          <span className="small dim mt4">Năng lượng duy trì sự sống</span>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #3fa9ff', padding: 16 }}>
          <span className="small muted">TDEE (Tổng tiêu hao/ngày)</span>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4, color: '#3fa9ff' }}>
            {plan.tdee} <span style={{ fontSize: 13, fontWeight: 500 }}>kcal</span>
          </div>
          <span className="small dim mt4">Bao gồm cả tập luyện</span>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #00d1b2', padding: 16, background: 'rgba(0, 209, 178, 0.05)' }}>
          <span className="small muted">Calo Mục Tiêu AI Khuyên</span>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4, color: '#00d1b2' }}>
            {plan.targetCalories} <span style={{ fontSize: 13, fontWeight: 500 }}>kcal/ngày</span>
          </div>
          <div className="row mt4 small" style={{ gap: 4 }}>
            <Badge color={plan.deficitOrSurplus < 0 ? 'amber' : plan.deficitOrSurplus > 0 ? 'green' : 'blue'}>
              {plan.deficitOrSurplus > 0 ? `+${plan.deficitOrSurplus}` : plan.deficitOrSurplus} kcal
            </Badge>
            <span className="dim">so với TDEE</span>
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #ff8fb0', padding: 16 }}>
          <span className="small muted">Lượng nước cần nạp</span>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4, color: '#ff8fb0' }}>
            {plan.waterLiters} <span style={{ fontSize: 13, fontWeight: 500 }}>lít/ngày</span>
          </div>
          <span className="small dim mt4">Đảm bảo trao đổi chất tốt</span>
        </div>
      </div>

      {/* PHÂN BỔ MACROS (PROTEIN - CARBS - FAT) */}
      <div className="card">
        <div className="card-head between">
          <h2><Apple size={18} /> Tỷ lệ phân bổ Macros (Đa lượng) mỗi ngày</h2>
          <span className="small muted">Tổng năng lượng: {plan.targetCalories} kcal</span>
        </div>

        <div className="grid g3 mb16" style={{ gap: 12 }}>
          <div className="card" style={{ padding: 14, background: 'rgba(0, 209, 178, 0.08)' }}>
            <div className="row between">
              <span className="bold" style={{ color: '#00d1b2' }}>🍗 Đạm (Protein)</span>
              <Badge color="green">{Math.round((plan.macros.protein * 4 / plan.targetCalories) * 100)}%</Badge>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, margin: '6px 0' }}>
              {plan.macros.protein} g
            </div>
            <span className="small dim">Tương đương {plan.macros.protein * 4} kcal để tái tạo mô cơ</span>
          </div>

          <div className="card" style={{ padding: 14, background: 'rgba(255, 176, 32, 0.08)' }}>
            <div className="row between">
              <span className="bold" style={{ color: '#ffb020' }}>🍚 Tinh bột (Carbs)</span>
              <Badge color="amber">{Math.round((plan.macros.carbs * 4 / plan.targetCalories) * 100)}%</Badge>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, margin: '6px 0' }}>
              {plan.macros.carbs} g
            </div>
            <span className="small dim">Tương đương {plan.macros.carbs * 4} kcal cung cấp năng lượng</span>
          </div>

          <div className="card" style={{ padding: 14, background: 'rgba(255, 92, 138, 0.08)' }}>
            <div className="row between">
              <span className="bold" style={{ color: '#ff5c8a' }}>🥑 Chất béo tốt (Fats)</span>
              <Badge color="red">{Math.round((plan.macros.fat * 9 / plan.targetCalories) * 100)}%</Badge>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, margin: '6px 0' }}>
              {plan.macros.fat} g
            </div>
            <span className="small dim">Tương đương {plan.macros.fat * 9} kcal điều hòa hormone</span>
          </div>
        </div>

        {/* Thanh trực quan Macros */}
        <div style={{ height: 10, width: '100%', background: 'var(--surface-2)', borderRadius: 99, display: 'flex', overflow: 'hidden' }}>
          <div style={{ width: `${Math.round((plan.macros.protein * 4 / plan.targetCalories) * 100)}%`, background: '#00d1b2' }} title="Protein" />
          <div style={{ width: `${Math.round((plan.macros.carbs * 4 / plan.targetCalories) * 100)}%`, background: '#ffb020' }} title="Carbs" />
          <div style={{ width: `${Math.round((plan.macros.fat * 9 / plan.targetCalories) * 100)}%`, background: '#ff5c8a' }} title="Fats" />
        </div>
      </div>

      {/* THỰC ĐƠN 5 BỮA TRONG NGÀY ĐƯỢC AI THIẾT KẾ CHI TIẾT */}
      <div className="card">
        <div className="card-head between">
          <div>
            <h2><Utensils size={18} /> Gợi ý thực đơn 5 bữa trong ngày theo mục tiêu</h2>
            <span className="small muted">Chia nhỏ bữa ăn giúp cơ thể hấp thu tối đa dinh dưỡng và kiểm soát cơn đói</span>
          </div>
          <Badge color="purple">{plan.goalLabel}</Badge>
        </div>

        <div className="col" style={{ gap: 12 }}>
          {plan.meals.map((meal, index) => (
            <div
              key={index}
              className="card hover"
              style={{
                padding: 16,
                borderLeft: `5px solid ${index === 0 ? '#ffb020' : index === 2 ? '#00d1b2' : index === 4 ? '#a78bfa' : '#3fa9ff'}`,
                background: 'var(--surface)',
              }}
            >
              <div className="row between wrap mb8" style={{ gap: 8 }}>
                <div className="row" style={{ gap: 10 }}>
                  <span className="badge b-purple">{meal.time}</span>
                  <h3 style={{ fontSize: 16 }}>{meal.name}</h3>
                </div>
                <div className="row" style={{ gap: 8 }}>
                  <span className="bold" style={{ color: 'var(--primary)', fontSize: 15 }}>
                    ~{meal.calories} kcal
                  </span>
                </div>
              </div>

              <p className="small muted mb8" style={{ lineHeight: 1.5 }}>
                {meal.description}
              </p>

              <div className="row wrap" style={{ gap: 6 }}>
                {meal.items.map((item, i) => (
                  <span
                    key={i}
                    style={{
                      background: 'var(--surface-2)',
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 12,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    ✓ {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LỜI KHUYÊN DINH DƯỠNG & NGUYÊN TẮC VÀNG */}
      <div className="card" style={{ background: 'var(--surface-2)' }}>
        <h3 className="mb12" style={{ fontSize: 16 }}>💡 Nguyên tắc vàng từ DFGym Nutrition AI</h3>
        <div className="grid g2" style={{ gap: 12 }}>
          {plan.tips.map((tip, idx) => (
            <div key={idx} className="card" style={{ padding: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: 14 }}>0{idx + 1}.</span>
              <p className="small muted" style={{ margin: 0, lineHeight: 1.5 }}>{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
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
