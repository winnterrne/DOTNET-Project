import { useState } from 'react';
import { ShieldAlert, AlertTriangle } from 'lucide-react';
import { Modal } from '../ui';
import { useApp } from '../../store/AppContext';
import * as L from '../../store/logic';
import { memberCardService } from '../../api/memberCard.service';
import type { CardStatus } from '../../types';

export interface ReportLostCardButtonProps {
  cardId: string;
  cardCode: string;
  status: CardStatus;
  onReported?: () => void;
}

export function ReportLostCardButton({
  cardId,
  cardCode,
  status,
  onReported,
}: ReportLostCardButtonProps) {
  const { user, act } = useApp();
  const [openConfirm, setOpenConfirm] = useState(false);
  const [reason, setReason] = useState('Làm rơi / thất lạc thẻ hội viên');
  const [loading, setLoading] = useState(false);

  if (!user || status === 'LOST') {
    return null;
  }

  const handleConfirmLost = async () => {
    setLoading(true);
    try {
      // Đồng bộ gọi API Backend PATCH /api/member-cards/{id}/status nếu có kết nối
      try {
        await memberCardService.updateCardStatus(cardId, {
          status: 'LOST',
          reason: reason.trim() || 'Hội viên báo mất thẻ',
        });
      } catch {
        // Fallback sang store cục bộ khi chạy ở chế độ Demo
      }

      act((d) => {
        L.updateMemberCardStatus(d, {
          cardId,
          status: 'LOST',
          actorId: user.id,
          isStaff: false,
          reason: reason.trim() || 'Hội viên tự báo mất thẻ',
        });
      }, `Đã báo mất và khóa vĩnh viễn thẻ ${cardCode}`);

      setOpenConfirm(false);
      onReported?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="btn danger sm"
        onClick={() => setOpenConfirm(true)}
        id="report-lost-card-btn"
      >
        <ShieldAlert size={15} /> Báo mất thẻ (Khóa khẩn cấp)
      </button>

      {openConfirm && (
        <Modal
          title="Xác nhận báo mất thẻ hội viên"
          onClose={() => setOpenConfirm(false)}
          footer={
            <>
              <button className="btn" onClick={() => setOpenConfirm(false)} disabled={loading}>
                Hủy bỏ
              </button>
              <button
                className="btn danger"
                onClick={handleConfirmLost}
                disabled={loading}
                id="confirm-report-lost-btn"
              >
                <ShieldAlert size={15} /> {loading ? 'Đang xử lý...' : 'Xác nhận Báo mất (LOST)'}
              </button>
            </>
          }
        >
          <div className="col" style={{ gap: 14 }}>
            <div
              className="card"
              style={{
                background: 'rgba(255, 77, 109, 0.1)',
                borderColor: 'rgba(255, 77, 109, 0.35)',
                padding: 14,
              }}
            >
              <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
                <AlertTriangle size={22} color="#ff4d6d" style={{ flexShrink: 0, marginTop: 2 }} />
                <div className="small" style={{ lineHeight: 1.5 }}>
                  <b>Lưu ý quan trọng:</b> Khi bạn báo mất thẻ <b>{cardCode}</b>, thẻ này sẽ chuyển sang trạng thái{' '}
                  <b>LOST</b> và bị <b>vô hiệu hóa vĩnh viễn</b> để ngăn người lạ quét mã QR check-in trái phép.
                  <br />
                  Sau khi báo mất, bạn vui lòng liên hệ <b>Quầy lễ tân</b> để được cấp lại thẻ mới (mã QR mới).
                </div>
              </div>
            </div>

            <div className="field">
              <label>Ghi chú / Lý do báo mất</label>
              <input
                className="input"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="VD: Làm rơi ví, mất điện thoại..."
              />
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

export default ReportLostCardButton;
