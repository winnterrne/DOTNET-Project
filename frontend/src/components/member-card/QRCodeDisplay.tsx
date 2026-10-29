import { QRCodeSVG } from 'qrcode.react';
import { Lock, ShieldAlert } from 'lucide-react';
import type { CardStatus } from '../../types';

export interface QRCodeDisplayProps {
  value: string;
  size?: number;
  status?: CardStatus;
  showCaption?: boolean;
}

export function QRCodeDisplay({
  value,
  size = 132,
  status = 'ACTIVE',
  showCaption = false,
}: QRCodeDisplayProps) {
  const isInactive = status === 'LOCKED' || status === 'LOST';

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div
        className="qr"
        style={{
          position: 'relative',
          padding: 10,
          background: '#ffffff',
          borderRadius: 14,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <div style={{ opacity: isInactive ? 0.22 : 1, filter: isInactive ? 'blur(1.5px)' : 'none', display: 'flex' }}>
          <QRCodeSVG
            value={value || 'DF-INVALID'}
            size={size}
            level="M"
            bgColor="#ffffff"
            fgColor="#0b0d17"
          />
        </div>

        {isInactive && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: status === 'LOST' ? 'rgba(220, 38, 38, 0.14)' : 'rgba(217, 119, 6, 0.14)',
              color: status === 'LOST' ? '#dc2626' : '#d97706',
              padding: 8,
              textAlign: 'center',
              fontWeight: 800,
              fontSize: 12,
            }}
          >
            {status === 'LOST' ? <ShieldAlert size={28} /> : <Lock size={28} />}
            <span style={{ marginTop: 4 }}>
              {status === 'LOST' ? 'THẺ ĐÃ BÁO MẤT' : 'THẺ TẠM KHÓA'}
            </span>
          </div>
        )}
      </div>

      {showCaption && (
        <span className="small muted" style={{ fontFamily: 'monospace', letterSpacing: 1 }}>
          {value}
        </span>
      )}
    </div>
  );
}

export default QRCodeDisplay;
