import { useState } from 'react';
import {
  Search,
  CreditCard,
  CheckCircle2,
  Lock,
  Unlock,
  ShieldAlert,
  QrCode,
  Plus,
} from 'lucide-react';
import { useApp } from '../../../store/AppContext';
import * as L from '../../../store/logic';
import { Avatar, Badge, Empty, Modal, PageHead, StatCard, Tabs } from '../../../components/ui';
import { mStatusLabel, cardStatusMeta } from '../../../components/labels';
import { fmtDate } from '../../../utils';
import {
  MemberCardWidget,
  StaffIssueCardModal,
} from '../../../components/member-card';
import { memberCardService } from '../../../api/memberCard.service';
import type { CardStatus, User } from '../../../types';

export function StaffMemberCardsScreen() {
  const { db, user, act } = useApp();
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CardStatus>('ALL');
  const [issuingMember, setIssuingMember] = useState<User | null>(null);
  const [viewingMember, setViewingMember] = useState<User | null>(null);

  const allMembers = db.users.filter((u) => u.role === 'member');
  const term = q.trim().toLowerCase();

  const rows = allMembers
    .map((m) => {
      const cards = L.memberCardsOf(db, m.id);
      const primary = cards[0];
      const status: CardStatus = primary?.status || m.cardStatus || 'ACTIVE';
      const cardCode = primary?.cardCode || m.cardCode || '—';
      return {
        member: m,
        cards,
        primary,
        status,
        cardCode,
      };
    })
    .filter((item) => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      if (!term) return true;
      return (
        item.member.fullName.toLowerCase().includes(term) ||
        item.member.email.toLowerCase().includes(term) ||
        item.member.phone.includes(term) ||
        item.cardCode.toLowerCase().includes(term) ||
        item.cards.some((c) => c.cardCode.toLowerCase().includes(term))
      );
    });

  const countByStatus = (st: CardStatus) =>
    allMembers.filter((m) => (L.activeCardOf(db, m.id)?.status ?? m.cardStatus ?? 'ACTIVE') === st).length;

  const handleChangeStatus = async (
    cardId: string,
    cardCode: string,
    memberName: string,
    newStatus: CardStatus,
    reason?: string,
  ) => {
    try {
      await memberCardService.updateCardStatus(cardId, {
        status: newStatus,
        reason,
      });
    } catch {
      // Fallback sang store cục bộ khi chạy ở chế độ Demo
    }

    act(
      (d) =>
        L.updateMemberCardStatus(d, {
          cardId,
          status: newStatus,
          actorId: user!.id,
          isStaff: true,
          reason,
        }),
      `Đã chuyển trạng thái thẻ ${cardCode} (${memberName}) sang ${newStatus}`,
    );
  };

  return (
    <>
      <PageHead
        title="Quản lý Thẻ hội viên & QR Code"
        desc="Lễ tân tra cứu hội viên, cấp thẻ mới (mã ngẫu nhiên bảo mật), khóa/mở khóa thẻ hoặc xử lý báo mất thẻ."
      />

      {/* Thống kê nhanh */}
      <div className="grid g4 mb16">
        <StatCard
          icon={<CreditCard size={22} />}
          label="Tổng hội viên có thẻ"
          value={allMembers.length}
          color="#7c5cff"
        />
        <StatCard
          icon={<CheckCircle2 size={22} />}
          label="Thẻ đang hoạt động (ACTIVE)"
          value={countByStatus('ACTIVE')}
          color="#2ed47a"
        />
        <StatCard
          icon={<Lock size={22} />}
          label="Thẻ đang tạm khóa (LOCKED)"
          value={countByStatus('LOCKED')}
          color="#ffb020"
        />
        <StatCard
          icon={<ShieldAlert size={22} />}
          label="Thẻ báo mất (LOST)"
          value={countByStatus('LOST')}
          color="#ff4d6d"
          sub="Cần cấp thẻ mới thay thế"
        />
      </div>

      {/* Bộ lọc & Tìm kiếm */}
      <div className="row between wrap mb16" style={{ gap: 12 }}>
        <Tabs
          value={statusFilter}
          onChange={setStatusFilter}
          tabs={[
            { id: 'ALL', label: 'Tất cả hội viên', count: allMembers.length },
            { id: 'ACTIVE', label: 'Đang hoạt động (ACTIVE)', count: countByStatus('ACTIVE') },
            { id: 'LOCKED', label: 'Tạm khóa (LOCKED)', count: countByStatus('LOCKED') },
            { id: 'LOST', label: 'Báo mất (LOST)', count: countByStatus('LOST') },
          ]}
        />

        <div className="input-icon" style={{ minWidth: 320, maxWidth: 420, flex: 1 }}>
          <Search size={17} />
          <input
            className="input"
            placeholder="Tìm theo tên, SĐT, email hoặc mã thẻ (Card_Code)..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            id="staff-card-search"
          />
        </div>
      </div>

      {/* Bảng danh sách hội viên & thẻ */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Hội viên</th>
              <th>Mã thẻ hiện tại (Card_Code)</th>
              <th>Trạng thái thẻ</th>
              <th>Gói hội viên</th>
              <th>Lịch sử thẻ</th>
              <th style={{ textAlign: 'right' }}>Thao tác Lễ tân</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ member, cards, primary, status, cardCode }) => {
              const ms = L.membershipOn(db, member.id);
              const latest = L.latestPaidMembership(db, member.id);
              const plan = ms ? L.planById(db, ms.planId) : undefined;
              const mSt = ms ? L.membershipStatus(db, ms) : latest ? L.membershipStatus(db, latest) : null;
              const cardId = primary?.id || member.id;

              return (
                <tr key={member.id}>
                  <td>
                    <div className="row" style={{ gap: 10 }}>
                      <Avatar user={member} size="sm" />
                      <div>
                        <div className="row" style={{ gap: 6 }}>
                          <b>{member.fullName}</b>
                          {member.locked && <Badge color="red">TK Khóa</Badge>}
                        </div>
                        <div className="small dim">
                          {member.phone} · {member.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        fontSize: 14,
                        letterSpacing: 1,
                        padding: '4px 8px',
                        borderRadius: 6,
                        background: 'var(--surface-2)',
                      }}
                    >
                      {cardCode}
                    </span>
                  </td>

                  <td>
                    <Badge color={cardStatusMeta[status].color}>
                      {status === 'ACTIVE' && 'ACTIVE · Hoạt động'}
                      {status === 'LOCKED' && 'LOCKED · Tạm khóa'}
                      {status === 'LOST' && 'LOST · Đã báo mất'}
                    </Badge>
                  </td>

                  <td>
                    {plan ? (
                      <div>
                        <div className="bold small">{plan.name}</div>
                        <div className="small dim">HSD: {fmtDate(ms!.endDate)}</div>
                      </div>
                    ) : mSt ? (
                      <Badge color={mStatusLabel[mSt][1]}>{mStatusLabel[mSt][0]}</Badge>
                    ) : (
                      <span className="small dim">Chưa có gói</span>
                    )}
                  </td>

                  <td>
                    <span className="small muted">{cards.length} thẻ đã cấp</span>
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <div className="row wrap" style={{ justifyContent: 'flex-end', gap: 6 }}>
                      <button
                        type="button"
                        className="btn sm ghost"
                        onClick={() => setViewingMember(member)}
                        title="Xem mã QR & lịch sử thẻ"
                      >
                        <QrCode size={15} /> QR & Lịch sử
                      </button>

                      {status === 'ACTIVE' && (
                        <button
                          type="button"
                          className="btn sm"
                          onClick={() =>
                            handleChangeStatus(
                              cardId,
                              cardCode,
                              member.fullName,
                              'LOCKED',
                              'Lễ tân tạm khóa thẻ tại quầy',
                            )
                          }
                          title="Khóa tạm thời thẻ này"
                        >
                          <Lock size={14} /> Khóa thẻ
                        </button>
                      )}

                      {status === 'LOCKED' && (
                        <button
                          type="button"
                          className="btn sm success"
                          onClick={() =>
                            handleChangeStatus(
                              cardId,
                              cardCode,
                              member.fullName,
                              'ACTIVE',
                              'Lễ tân mở khóa thẻ tại quầy',
                            )
                          }
                          title="Mở khóa lại thẻ này"
                        >
                          <Unlock size={14} /> Mở khóa
                        </button>
                      )}

                      {status !== 'LOST' && (
                        <button
                          type="button"
                          className="btn sm danger"
                          onClick={() =>
                            handleChangeStatus(
                              cardId,
                              cardCode,
                              member.fullName,
                              'LOST',
                              'Lễ tân ghi nhận hội viên báo mất thẻ',
                            )
                          }
                          title="Đánh dấu thẻ bị mất (Vô hiệu hóa vĩnh viễn)"
                        >
                          <ShieldAlert size={14} /> Báo mất
                        </button>
                      )}

                      <button
                        type="button"
                        className="btn sm primary"
                        onClick={() => setIssuingMember(member)}
                        id={`issue-card-${member.id}`}
                        title="Cấp thẻ mới (Thẻ cũ tự chuyển sang LOCKED/LOST)"
                      >
                        <Plus size={14} /> Cấp thẻ mới
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <Empty
            text="Không tìm thấy hội viên hoặc thẻ phù hợp với bộ lọc"
            icon={<CreditCard size={40} />}
          />
        )}
      </div>

      {/* Modal cấp thẻ mới */}
      {issuingMember && (
        <StaffIssueCardModal
          member={issuingMember}
          onClose={() => setIssuingMember(null)}
        />
      )}

      {/* Modal xem chi tiết thẻ, QR Code & Lịch sử thẻ */}
      {viewingMember && (
        <Modal
          title={`Chi tiết Thẻ hội viên & QR Code · ${viewingMember.fullName}`}
          onClose={() => setViewingMember(null)}
          wide
          footer={
            <div className="row between" style={{ width: '100%' }}>
              <button
                className="btn primary"
                onClick={() => {
                  const target = viewingMember;
                  setViewingMember(null);
                  setIssuingMember(target);
                }}
              >
                <Plus size={15} /> Cấp đổi thẻ mới cho hội viên này
              </button>
              <button className="btn" onClick={() => setViewingMember(null)}>
                Đóng
              </button>
            </div>
          }
        >
          <MemberCardWidget memberId={viewingMember.id} showHistory />
        </Modal>
      )}
    </>
  );
}

export default StaffMemberCardsScreen;
