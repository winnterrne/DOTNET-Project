import { useState } from 'react';
import { Save } from 'lucide-react';
import { useApp } from '../../../store/AppContext';
import { PageHead } from '../../../components/ui';
import type { Settings } from '../../../types';

export function AdminSettingsScreen() {
  const { db, act } = useApp();
  const [f, setF] = useState<Settings>({ ...db.settings });

  const handleSave = () => {
    act((d) => {
      d.settings = { ...f };
    }, 'Đã lưu cấu hình hệ thống');
  };

  return (
    <>
      <PageHead
        title="Cấu hình Hệ thống"
        desc="Thiết lập các mốc thời gian nhắc lịch, giới hạn hủy và xử lý danh sách chờ tự động."
        actions={
          <button className="btn primary" onClick={handleSave} id="btn-save-settings">
            <Save size={16} /> Lưu cấu hình
          </button>
        }
      />

      <div className="card" style={{ maxWidth: 760 }}>
        <div className="col" style={{ gap: 20 }}>
          <div className="field">
            <label>Thời gian nhắc lịch tập sắp diễn ra (giờ trước buổi tập)</label>
            <input
              type="number"
              min={1}
              max={24}
              className="input"
              value={f.reminderHours}
              onChange={(e) => setF({ ...f, reminderHours: +e.target.value })}
            />
            <span className="small dim">Mặc định 2 giờ. Gửi thông báo đến hội viên và HLV.</span>
          </div>

          <div className="field">
            <label>Thời hạn được hủy lịch hoàn trả lượt/buổi (giờ trước buổi tập)</label>
            <input
              type="number"
              min={1}
              max={48}
              className="input"
              value={f.cancelDeadlineHours}
              onChange={(e) => setF({ ...f, cancelDeadlineHours: +e.target.value })}
            />
            <span className="small dim">Mặc định 4 giờ. Hủy sau mốc này sẽ bị tính lượt (late cancelled).</span>
          </div>

          <div className="field">
            <label>Mốc hết hạn Danh sách chờ (Waitlist Cutoff) (giờ trước buổi tập)</label>
            <input
              type="number"
              min={1}
              max={24}
              className="input"
              value={f.waitlistCutoffHours}
              onChange={(e) => setF({ ...f, waitlistCutoffHours: +e.target.value })}
            />
            <span className="small dim">Theo nghiệp vụ: Khoảng 8 tiếng trước giờ học, nếu hội viên trong hàng chờ vẫn chưa được xếp chỗ thì thông báo lớp đã đầy và yêu cầu chọn lịch khác.</span>
          </div>

          <div className="field">
            <label>Cảnh báo gói hội viên / gói PT sắp hết hạn (ngày trước hạn)</label>
            <input
              type="number"
              min={1}
              max={30}
              className="input"
              value={f.expiryWarningDays}
              onChange={(e) => setF({ ...f, expiryWarningDays: +e.target.value })}
            />
            <span className="small dim">Gửi nhắc nhở gia hạn khi gói còn dưới số ngày này (mặc định 7 ngày).</span>
          </div>

          <div className="field">
            <label>Cảnh báo gói PT sắp hết số buổi</label>
            <input
              type="number"
              min={1}
              max={5}
              className="input"
              value={f.ptLowSessions}
              onChange={(e) => setF({ ...f, ptLowSessions: +e.target.value })}
            />
            <span className="small dim">Gửi thông báo khi gói PT còn dưới số buổi này (mặc định 2 buổi).</span>
          </div>
        </div>
      </div>
    </>
  );
}

export default AdminSettingsScreen;
