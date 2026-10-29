import { useState } from 'react';
import { Wifi, Copy, Check, CreditCard, ShieldAlert, Lock, CheckCircle2, History } from 'lucide-react';
import { Badge } from '../ui';
import { mStatusLabel, cardStatusMeta } from '../labels';
import { fmtDate, fmtDateTime } from '../../utils';
import { useApp } from '../../store/AppContext';
import * as L from '../../store/logic';
import { QRCodeDisplay } from './QRCodeDisplay';
import { ReportLostCardButton } from './ReportLostCardButton';
import type { CardStatus } from '../../types';

export interface MemberCardWidgetProps {
  memberId?: string;
  compact?: boolean;
  showHistory?: boolean;
}

export function MemberCardWidget({
  memberId,
  compact = false,
  showHistory = true,
}: MemberCardWidgetProps) {
  const { db, user } = useApp();
  const [copied, setCopied] = useState(false);

  const targetUser = memberId ? L.userById(db, memberId) : user;
  if (!targetUser || targetUser.role !== 'member') return null;

  const cards = L.memberCardsOf(db, targetUser.id);
  const currentCard = cards[0];
  const cardCode = currentCard?.cardCode || targetUser.cardCode || 'DF-NONE';
  const cardStatus: CardStatus = currentCard?.status || targetUser.cardStatus || 'ACTIVE';
  const cardId = currentCard?.id || targetUser.id;

  const curMembership = L.membershipOn(db, targetUser.id);
  const plan = curMembership ? L.planById(db, curMembership.planId) : undefined;
  const mSt = curMembership ? L.membershipStatus(db, curMembership) : 'expired';
  const isOwner = user?.id === targetUser.id;

  const copyCardCode = () => {
    navigator.clipboard.writeText(cardCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="col" style={{ gap: 16 }}>
      <div
        className="member-card"
        style={{
          background:
            cardStatus === 'LOST'
              ? 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 55%, #991b1b 100%)'
              : cardStatus === 'LOCKED'
              ? 'linear-gradient(135deg, #422006 0%, #78350f 55%, #92400e 100%)'
              : undefined,
        }}
      >
        <div style={{ position: 'relative' }}>
          <div className="row between">
            <div className="row" style={{ gap: 8 }}>
              <CreditCard size={20} style={{ opacity: 0.9 }} />
              <div className="brand-name">
                DFGym<span style={{ color: '#ff8fb0' }}>Center</span>
              </div>
            </div>
            <div className="row" style={{ gap: 10 }}>
              <Badge color={cardStatusMeta[cardStatus].color}>
                {cardStatus === 'ACTIVE' && <CheckCircle2 size={12} style={{ marginRight: 4 }} />}
                {cardStatus === 'LOCKED' && <Lock size={12} style={{ marginRight: 4 }} />}
                {cardStatus === 'LOST' && <ShieldAlert size={12} style={{ marginRight: 4 }} />}
                {cardStatusMeta[cardStatus].label}
              </Badge>
              <Wifi size={20} style={{ transform: 'rotate(90deg)', opacity: 0.7 }} />
            </div>
          </div>

          <div
            className="row between mt24 wrap"
            style={{ alignItems: 'flex-end', gap: 16 }}
          >
            <div>
              <div className="small" style={{ opacity: 0.75 }}>
                Chủ thẻ hội viên
              </div>
              <div style={{ fontSize: compact ? 19 : 22, fontWeight: 800 }}>
                {targetUser.fullName}
              </div>

              <div className="row" style={{ gap: 8, marginTop: 8 }}>
                <div
                  style={{
                    fontFamily: 'monospace',
                    fontSize: compact ? 16 : 19,
                    letterSpacing: 2.5,
                    fontWeight: 700,
                    background: 'rgba(255,255,255,0.14)',
                    padding: '4px 10px',
                    borderRadius: 8,
                  }}
                >
                  {cardCode}
                </div>
                <button
                  type="button"
                  onClick={copyCardCode}
                  title="Sao chép mã thẻ"
                  style={{
                    background: 'rgba(255,255,255,0.16)',
                    border: 'none',
                    color: '#fff',
                    borderRadius: 8,
                    padding: '6px 9px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 12,
                  }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Đã chép' : 'Copy'}
                </button>
              </div>

              <div className="row mt16 wrap" style={{ gap: 8 }}>
                {plan ? (
                  <Badge color="pink">{plan.name}</Badge>
                ) : (
                  <Badge color="gray">Chưa đăng ký gói</Badge>
                )}
                <Badge color={mStatusLabel[mSt][1]}>{mStatusLabel[mSt][0]}</Badge>
              </div>
              {curMembership && (
                <div className="small mt8" style={{ opacity: 0.8 }}>
                  Hiệu lực gói: {fmtDate(curMembership.startDate)} → {fmtDate(curMembership.endDate)}
                </div>
              )}
            </div>

            <QRCodeDisplay
              value={cardCode}
              size={compact ? 112 : 128}
              status={cardStatus}
            />
          </div>
        </div>
      </div>

      {/* Thanh trạng thái & Nút Báo mất thẻ */}
      <div className="card" style={{ padding: '14px 16px' }}>
        <div className="row between wrap" style={{ gap: 12 }}>
          <div className="row" style={{ gap: 10 }}>
            {cardStatus === 'ACTIVE' && <CheckCircle2 size={20} color="#2ed47a" />}
            {cardStatus === 'LOCKED' && <Lock size={20} color="#ffb020" />}
            {cardStatus === 'LOST' && <ShieldAlert size={20} color="#ff4d6d" />}
            <div>
              <div className="bold" style={{ fontSize: 14 }}>
                Trạng thái thẻ: {cardStatusMeta[cardStatus].label}
              </div>
              <div className="small muted">{cardStatusMeta[cardStatus].desc}</div>
            </div>
          </div>

          {isOwner && cardStatus !== 'LOST' && (
            <ReportLostCardButton
              cardId={cardId}
              cardCode={cardCode}
              status={cardStatus}
            />
          )}
        </div>
      </div>

      {/* Lịch sử các thẻ đã cấp của hội viên */}
      {showHistory && cards.length > 1 && (
        <div className="card" style={{ padding: '14px 16px' }}>
          <div className="row between mb12">
            <h3 style={{ fontSize: 14.5, display: 'flex', alignItems: 'center', gap: 6 }}>
              <History size={16} /> Lịch sử cấp / đổi thẻ hội viên ({cards.length})
            </h3>
            <span className="small muted">Thẻ cũ tự động chuyển LOCKED / LOST khi cấp thẻ mới</span>
          </div>
          <div className="col" style={{ gap: 8 }}>
            {cards.map((c, idx) => (
              <div
                key={c.id}
                className="row between wrap"
                style={{
                  padding: '8px 12px',
                  borderRadius: 10,
                  background: idx === 0 ? 'var(--primary-soft)' : 'var(--surface-2)',
                  border: idx === 0 ? '1px solid var(--primary)' : '1px solid var(--border)',
                }}
              >
                <div className="row" style={{ gap: 10 }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13.5 }}>
                    {c.cardCode}
                  </span>
                  {idx === 0 && <Badge color="purple" plain>Thẻ hiện tại</Badge>}
                  {c.reason && <span className="small muted">· {c.reason}</span>}
                </div>
                <div className="row" style={{ gap: 10 }}>
                  <span className="small dim">{fmtDateTime(c.issuedAt)}</span>
                  <Badge color={cardStatusMeta[c.status].color}>{c.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default MemberCardWidget;
