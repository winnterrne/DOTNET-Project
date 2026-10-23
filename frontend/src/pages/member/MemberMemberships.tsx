import { useState } from 'react';
import { Check, Snowflake, RefreshCw, Dumbbell, Crown, CreditCard, History, Gift, MapPin } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import * as L from '../../store/logic';
import { Badge, Modal, PageHead, PaymentModal, Tabs, Empty, Progress } from '../../components/ui';
import { mStatusLabel, reqLabel } from '../../components/labels';
import { fmtDate, fmtMoney, addDays, todayStr, diffDays, fmtDateTime } from '../../utils';
import type { MembershipPlan, PTPlan } from '../../types';

type Pay =
  | { kind: 'ms'; plan: MembershipPlan; branchId: string; retryId?: string }
  | { kind: 'pt'; plan: PTPlan; branchId: string; retryId?: string };

export function MemberMemberships() {
  const { db, user, act, toast } = useApp();
  const uid = user!.id;
  const [tab, setTab] = useState<'mine' | 'plans' | 'pt' | 'freeze'>('mine');
  const [pay, setPay] = useState<Pay | null>(null);
  const [branchPick, setBranchPick] = useState<{ plan: MembershipPlan | PTPlan; kind: 'ms' | 'pt' } | null>(null);
  const [freezeFor, setFreezeFor] = useState<string | null>(null);

  const ms = db.memberships.filter((m) => m.memberId === uid).sort((a, b) => b.startDate.localeCompare(a.startDate));
  const pts = db.ptPackages.filter((p) => p.memberId === uid).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const freezes = db.freezeRequests.filter((f) => f.memberId === uid);
  const current = L.membershipOn(db, uid);
  const latest = L.latestPaidMembership(db, uid);
  const hasValid = !!latest && latest.endDate >= todayStr();
  const balance = L.ptBalance(db, uid);

  const doPay = (method: Parameters<typeof L.payMembership>[3], success: boolean) => {
    if (!pay) return;
    act(
      (d) => {
        if (pay.kind === 'ms') return pay.retryId ? L.payMembership(d, pay.retryId, pay.branchId, method, success) : L.purchaseMembership(d, uid, pay.plan.id, pay.branchId, method, success);
        return pay.retryId ? L.payPT(d, pay.retryId, pay.branchId, method, success) : L.purchasePT(d, uid, pay.plan.id, pay.branchId, method, success);
      },
      (ok) => (ok ? 'Thanh toán thành công – gói đã được kích hoạt!' : undefined),
    );
    if (!success) toast('Thanh toán thất bại – gói chưa được kích hoạt. Bạn có thể thanh toán lại.', 'error');
    setPay(null);
    if (success) setTab('mine');
  };

  const choose = (plan: MembershipPlan | PTPlan, kind: 'ms' | 'pt') => {
    if (kind === 'pt' && !current) return act(() => { throw new Error('Bạn cần có gói hội viên còn hiệu lực để mua gói PT'); });
    const branches = plan.branchScope === 'all' ? db.branches : db.branches.filter((b) => (plan.branchScope as string[]).includes(b.id));
    if (branches.length === 1) setPay(kind === 'ms' ? { kind, plan: plan as MembershipPlan, branchId: branches[0].id } : { kind, plan: plan as PTPlan, branchId: branches[0].id });
    else setBranchPick({ plan, kind });
  };

  return (
    <>
      <PageHead title="Gói tập của tôi" desc="Mua, gia hạn, tạm ngưng gói hội viên và quản lý gói PT 1-kèm-1." />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'mine', label: <><CreditCard size={15} /> Gói của tôi</> },
          { id: 'plans', label: <><Crown size={15} /> {hasValid ? 'Gia hạn / mua gói' : 'Mua gói hội viên'}</> },
          { id: 'pt', label: <><Dumbbell size={15} /> Gói PT 1-kèm-1</> },
          { id: 'freeze', label: <><Snowflake size={15} /> Yêu cầu freeze</>, count: freezes.filter((f) => f.status === 'pending').length },
        ]}
      />

      {tab === 'mine' && (
        <div className="col" style={{ gap: 18 }}>
          <div className="grid g3">
            <div className="card">
              <div className="small muted">Buổi PT khả dụng</div>
              <div style={{ fontSize: 30, fontWeight: 800 }} className="grad-text">{balance.total}</div>
              <div className="row small muted mt8"><Gift size={14} /> {balance.free} tặng kèm (dùng trước) · <Dumbbell size={14} /> {balance.pkg} từ gói PT</div>
            </div>
            <div className="card">
              <div className="small muted">Hạn gói hội viên</div>
              <div style={{ fontSize: 30, fontWeight: 800 }}>{latest ? fmtDate(latest.endDate) : '—'}</div>
              <div className="small muted mt8">{hasValid ? `Còn ${diffDays(todayStr(), latest!.endDate)} ngày (tính cả gói nối tiếp)` : 'Chưa có gói hiệu lực'}</div>
            </div>
            <div className="card row between">
              <div>
                <div className="small muted">Gia hạn nhanh</div>
                <div className="small muted mt8">Gói mới nối tiếp từ ngày hết hạn hiện tại.</div>
              </div>
              <button className="btn primary" onClick={() => setTab('plans')} id="quick-renew"><RefreshCw size={16} /> Gia hạn</button>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h2><History size={18} /> Gói hội viên & lịch sử</h2></div>
            {ms.length === 0 ? <Empty text="Bạn chưa mua gói nào" /> : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Gói</th><th>Thời hạn</th><th>Phạm vi</th><th>PT tặng</th><th>Freeze</th><th>Trạng thái</th><th></th></tr></thead>
                  <tbody>
                    {ms.map((m) => {
                      const p = L.planById(db, m.planId)!;
                      const st = L.membershipStatus(db, m);
                      return (
                        <tr key={m.id}>
                          <td><div className="row"><span style={{ width: 10, height: 10, borderRadius: 4, background: p.color }} /><b>{p.name}</b>{m.isRenewal && <Badge color="gray" plain>Gia hạn</Badge>}</div></td>
                          <td>{m.payStatus === 'paid' ? `${fmtDate(m.startDate)} → ${fmtDate(m.endDate)}` : '—'}</td>
                          <td className="small">{L.scopeLabel(db, p.branchScope)}</td>
                          <td>{m.freeSessionsTotal ? `${m.freeSessionsTotal - m.freeSessionsUsed}/${m.freeSessionsTotal}` : '—'}</td>
                          <td className="small">{p.maxFreezeTimes ? `${m.freezeCountUsed}/${p.maxFreezeTimes} lần · ${m.freezeDaysUsed}/${p.maxFreezeDays} ngày` : 'Không hỗ trợ'}</td>
                          <td><Badge color={mStatusLabel[st][1]}>{mStatusLabel[st][0]}</Badge></td>
                          <td style={{ textAlign: 'right' }}>
                            {st === 'pending_payment' && <button className="btn sm primary" onClick={() => setPay({ kind: 'ms', plan: p, branchId: p.branchScope === 'all' ? 'br1' : p.branchScope[0], retryId: m.id })}>Thanh toán lại</button>}
                            {['active', 'upcoming', 'frozen'].includes(st) && p.maxFreezeTimes > 0 && (
                              <button className="btn sm" onClick={() => setFreezeFor(m.id)} id={`freeze-${m.id}`}><Snowflake size={14} /> Freeze</button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-head"><h2><Dumbbell size={18} /> Gói PT đã mua</h2><button className="btn sm" onClick={() => setTab('pt')}>Mua thêm</button></div>
            {pts.length === 0 ? <Empty text="Chưa có gói PT" /> : (
              <div className="grid g-auto">
                {pts.map((p) => {
                  const plan = L.ptPlanById(db, p.ptPlanId)!;
                  const valid = L.ptPackageValid(p);
                  const expired = p.payStatus === 'paid' && p.endDate < todayStr();
                  const usedUp = p.sessionsUsed >= p.sessionsTotal;
                  const label: [string, string] = p.payStatus === 'pending_payment' ? ['Chờ thanh toán', 'amber'] : expired ? ['Hết thời hạn', 'gray'] : usedUp ? ['Đã dùng hết', 'gray'] : !current ? ['Bảo lưu', 'purple'] : ['Đang hiệu lực', 'green'];
                  return (
                    <div className="card" key={p.id} style={{ background: 'rgba(0,209,178,.05)' }}>
                      <div className="row between"><b>{plan.name}</b><Badge color={label[1]}>{label[0]}</Badge></div>
                      {p.payStatus === 'paid' ? (
                        <>
                          <div className="row between mt16 small"><span className="muted">Đã dùng</span><b>{p.sessionsUsed}/{p.sessionsTotal} buổi</b></div>
                          <div className="mt8"><Progress value={(p.sessionsUsed / p.sessionsTotal) * 100} color="linear-gradient(90deg,#00d1b2,#3fa9ff)" /></div>
                          <div className="small muted mt8">Hạn dùng: {fmtDate(p.startDate)} → {fmtDate(p.endDate)}</div>
                          {valid && !current && <div className="small mt8" style={{ color: '#b8a6ff' }}>Buổi còn lại được bảo lưu, dùng lại khi bạn có gói hội viên hiệu lực.</div>}
                        </>
                      ) : (
                        <button className="btn primary sm mt16" onClick={() => setPay({ kind: 'pt', plan, branchId: 'br1', retryId: p.id })}>Thanh toán lại</button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'plans' && (
        <>
          {hasValid && <div className="card mb16 small muted">🔁 Bạn đang có gói đến <b>{fmtDate(latest!.endDate)}</b>. Gói mua thêm sẽ được <b>nối tiếp</b> từ ngày {fmtDate(addDays(latest!.endDate, 1))}.</div>}
          <div className="grid g-auto">
            {db.membershipPlans.filter((p) => p.active).map((p) => (
              <div className="card plan-card hover" key={p.id}>
                <div className="plan-top" style={{ background: p.color }} />
                {p.priority >= 3 && <div className="ribbon">HOT</div>}
                <div className="row"><Crown size={18} color={p.color} /><h2>{p.name}</h2></div>
                <div className="small muted mt8">{p.description}</div>
                <div className="price">{fmtMoney(p.price)}</div>
                <div className="small dim">/{p.durationMonths} tháng · ≈ {fmtMoney(Math.round(p.price / p.durationMonths))}/tháng</div>
                <ul>
                  <li><MapPin size={15} />{L.scopeLabel(db, p.branchScope)}</li>
                  {p.benefits.map((b) => <li key={b}><Check size={15} />{b}</li>)}
                </ul>
                <button className="btn primary block" onClick={() => choose(p, 'ms')} id={`buy-${p.id}`}>{hasValid ? 'Gia hạn bằng gói này' : 'Mua ngay'}</button>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'pt' && (
        <>
          <div className="card mb16 small muted">
            💡 Gói PT dùng theo số buổi trong thời hạn nhất định, không áp dụng freeze. Chỉ mua/sử dụng được khi có gói hội viên hiệu lực; khi gói hội viên hết hạn, buổi còn lại được bảo lưu đến hết hạn gói PT.
          </div>
          <div className="grid g-auto">
            {db.ptPlans.filter((p) => p.active).map((p) => (
              <div className="card plan-card hover" key={p.id}>
                <div className="plan-top" style={{ background: 'var(--grad-teal)' }} />
                <div className="row"><Dumbbell size={18} color="#00d1b2" /><h2>{p.name}</h2></div>
                <div className="small muted mt8">{p.description}</div>
                <div className="price">{fmtMoney(p.price)}</div>
                <div className="small dim">{fmtMoney(Math.round(p.price / p.sessions))}/buổi</div>
                <ul>
                  <li><Check size={15} />{p.sessions} buổi tập 1-kèm-1</li>
                  <li><Check size={15} />Sử dụng trong {p.validityDays} ngày</li>
                  <li><MapPin size={15} />{L.scopeLabel(db, p.branchScope)}</li>
                </ul>
                <button className="btn primary block" disabled={!current} onClick={() => choose(p, 'pt')} id={`buy-${p.id}`}>{current ? 'Mua gói PT' : 'Cần gói hội viên hiệu lực'}</button>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'freeze' && (
        <div className="card">
          <div className="card-head"><h2><Snowflake size={18} /> Lịch sử yêu cầu tạm ngưng</h2></div>
          {freezes.length === 0 ? <Empty text="Chưa có yêu cầu freeze nào" /> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Gửi lúc</th><th>Gói</th><th>Khoảng tạm ngưng</th><th>Số ngày</th><th>Lý do</th><th>Trạng thái</th><th>Phản hồi</th></tr></thead>
                <tbody>
                  {freezes.map((f) => {
                    const m = db.memberships.find((x) => x.id === f.membershipId);
                    return (
                      <tr key={f.id}>
                        <td className="small">{fmtDateTime(f.createdAt)}</td>
                        <td>{L.planById(db, m?.planId ?? '')?.name}</td>
                        <td>{fmtDate(f.startDate)} → {fmtDate(f.endDate)}</td>
                        <td>{f.days}</td>
                        <td className="small muted">{f.reason}</td>
                        <td><Badge color={reqLabel[f.status][1]}>{reqLabel[f.status][0]}</Badge></td>
                        <td className="small">{f.note || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {branchPick && (
        <Modal title="Chọn chi nhánh đăng ký" onClose={() => setBranchPick(null)}>
          <p className="muted mb16">Chi nhánh nơi bạn thanh toán (dùng cho thống kê). Quyền tập theo phạm vi gói: <b>{L.scopeLabel(db, branchPick.plan.branchScope)}</b>.</p>
          <div className="col">
            {(branchPick.plan.branchScope === 'all' ? db.branches : db.branches.filter((b) => (branchPick.plan.branchScope as string[]).includes(b.id))).map((b) => (
              <button key={b.id} className="demo-acc" onClick={() => { setPay(branchPick.kind === 'ms' ? { kind: 'ms', plan: branchPick.plan as MembershipPlan, branchId: b.id } : { kind: 'pt', plan: branchPick.plan as PTPlan, branchId: b.id }); setBranchPick(null); }}>
                <MapPin size={18} color="#a78bfa" /><div><b>{b.name}</b><div className="small dim">{b.address}</div></div>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {pay && (
        <PaymentModal
          title={pay.kind === 'ms' ? `${hasValid && !pay.retryId ? 'Gia hạn' : 'Gói hội viên'} ${pay.plan.name}` : `Gói PT ${pay.plan.name}`}
          amount={pay.plan.price}
          lines={[
            ['Chi nhánh', L.branchById(db, pay.branchId)?.name ?? ''],
            pay.kind === 'ms'
              ? ['Hiệu lực từ', fmtDate(hasValid ? addDays(latest!.endDate, 1) : todayStr())]
              : ['Số buổi', `${(pay.plan as PTPlan).sessions} buổi / ${(pay.plan as PTPlan).validityDays} ngày`],
          ]}
          onClose={() => setPay(null)}
          onPay={doPay}
        />
      )}
      {freezeFor && <FreezeModal membershipId={freezeFor} onClose={() => setFreezeFor(null)} />}
    </>
  );
}

function FreezeModal({ membershipId, onClose }: { membershipId: string; onClose: () => void }) {
  const { db, user, act } = useApp();
  const m = db.memberships.find((x) => x.id === membershipId)!;
  const p = L.planById(db, m.planId)!;
  const [start, setStart] = useState(addDays(todayStr(), 1));
  const [days, setDays] = useState(7);
  const [reason, setReason] = useState('');
  const remainDays = p.maxFreezeDays - m.freezeDaysUsed;
  const submit = () => {
    const ok = act((d) => L.requestFreeze(d, user!.id, m.id, start, days, reason), 'Đã gửi yêu cầu freeze, vui lòng chờ lễ tân duyệt');
    if (ok !== undefined) onClose();
  };
  return (
    <Modal
      title={<span className="row"><Snowflake size={20} color="#7cc4ff" /> Yêu cầu tạm ngưng gói</span>}
      onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Hủy</button><button className="btn primary" onClick={submit} disabled={!reason.trim()} id="freeze-submit">Gửi yêu cầu</button></>}
    >
      <div className="grid g3 mb16" style={{ gap: 10 }}>
        <div className="card" style={{ padding: 14 }}><div className="small muted">Lần còn lại</div><b style={{ fontSize: 20 }}>{p.maxFreezeTimes - m.freezeCountUsed}</b></div>
        <div className="card" style={{ padding: 14 }}><div className="small muted">Ngày còn lại</div><b style={{ fontSize: 20 }}>{remainDays}</b></div>
        <div className="card" style={{ padding: 14 }}><div className="small muted">Hạn mới dự kiến</div><b style={{ fontSize: 16 }}>{fmtDate(addDays(m.endDate, days))}</b></div>
      </div>
      <div className="form-grid">
        <div className="field"><label>Bắt đầu từ</label><input type="date" className="input" min={addDays(todayStr(), 1)} max={m.endDate} value={start} onChange={(e) => setStart(e.target.value)} id="freeze-start" /></div>
        <div className="field"><label>Số ngày (tối đa {remainDays})</label><input type="number" className="input" min={1} max={remainDays} value={days} onChange={(e) => setDays(+e.target.value)} id="freeze-days" /></div>
        <div className="field full"><label>Lý do</label><textarea className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="VD: Đi công tác, ốm..." id="freeze-reason" /></div>
      </div>
      <div className="small muted mt16">⚠️ Khi được duyệt, các lịch lớp/PT trong khoảng {fmtDate(start)} → {fmtDate(addDays(start, days - 1))} sẽ tự động bị hủy và hoàn lượt/buổi PT.</div>
    </Modal>
  );
}
