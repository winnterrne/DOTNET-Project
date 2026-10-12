import { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  QrCode,
  CalendarDays,
  Snowflake,
  Dumbbell,
  Search,
  BookOpen,
  FileCheck,
} from 'lucide-react';
import { PageHead, Badge, Tabs } from '../../components/ui';

interface RuleSection {
  id: string;
  category: 'checkin' | 'booking' | 'safety' | 'freeze' | 'etiquette';
  title: string;
  icon: typeof ShieldAlert;
  color: string;
  summary: string;
  rules: {
    title: string;
    detail: string;
    important?: boolean;
    penalty?: string;
  }[];
}

const GYM_RULES_DATA: RuleSection[] = [
  {
    id: 'checkin',
    category: 'checkin',
    title: '1. Quy định Thẻ Hội Viên & Check-in',
    icon: QrCode,
    color: '#6366f1',
    summary: 'Áp dụng cho mọi hội viên khi ra vào tất cả các chi nhánh thuộc hệ thống DFGymCenter.',
    rules: [
      {
        title: 'Check-in bắt buộc tại quầy hoặc máy Kiosk',
        detail: 'Hội viên phải xuất trình mã QR trên ứng dụng hoặc thẻ từ vật lý để quét check-in trước khi vào khu vực tập luyện. Nhân viên lễ tân có quyền từ chối nếu thẻ chưa được kích hoạt hoặc đang bị tạm khóa.',
        important: true,
      },
      {
        title: 'Chính chủ - Nghiêm cấm cho mượn thẻ',
        detail: 'Thẻ hội viên mang tính định danh cá nhân. Tuyệt đối không cho người khác mượn thẻ hoặc dùng chung tài khoản dưới bất kỳ hình thức nào.',
        penalty: 'Tạm đình chỉ quyền lợi thẻ 14 ngày đối với lần vi phạm đầu tiên và hủy tư cách hội viên vĩnh viễn nếu tái phạm.',
        important: true,
      },
      {
        title: 'Khung giờ hoạt động chi nhánh',
        detail: 'Hội viên chỉ được tập luyện trong khung giờ mở cửa niêm yết của chi nhánh (Thứ 2 - Thứ 7: 06:00 - 22:00; Chủ Nhật: 07:00 - 21:00). Vui lòng hoàn tất tập luyện và check-out trước giờ đóng cửa 15 phút.',
      },
    ],
  },
  {
    id: 'booking',
    category: 'booking',
    title: '2. Quy định Đặt Lịch Lớp Nhóm & Buổi PT 1-Kèm-1',
    icon: CalendarDays,
    color: '#0d9488',
    summary: 'Đảm bảo sự công bằng và tính chuyên nghiệp trong việc giữ chỗ lớp học và huấn luyện viên cá nhân.',
    rules: [
      {
        title: 'Thời gian mở đặt chỗ trước',
        detail: 'Lớp học nhóm mở đặt chỗ trước tối đa 7 ngày. Buổi tập PT 1-kèm-1 phải được đặt trước giờ bắt đầu tối thiểu 2 giờ để HLV kịp chuẩn bị giáo án chuyên biệt.',
      },
      {
        title: 'Thời hạn hủy lịch hợp lệ (Trước 2 tiếng)',
        detail: 'Hội viên có quyền hủy lịch hẹn lớp học hoặc ca PT trước giờ bắt đầu tối thiểu 2 tiếng. Lượt đặt hoặc buổi tập sẽ được hoàn trả tự động vào gói của bạn.',
        important: true,
      },
      {
        title: 'Chính sách Hủy muộn & Vắng mặt (No-Show)',
        detail: 'Hủy lịch dưới 2 tiếng hoặc không đến buổi tập (No-show) sẽ bị tính là 1 buổi đã sử dụng và không được hoàn lượt.',
        penalty: 'Nếu vắng mặt không báo trước (No-show) từ 3 lần trong vòng 30 ngày, hệ thống sẽ tạm khóa tính năng đặt lịch trước trong 7 ngày.',
        important: true,
      },
      {
        title: 'Quy tắc Hàng đợi Danh sách chờ (Waitlist)',
        detail: 'Khi lớp đầy, hội viên đăng ký Waitlist sẽ được xếp thứ tự theo cấp bậc ưu tiên của gói tập và thời điểm đăng ký. Nếu có người hủy trước giờ học 1 tiếng, hệ thống sẽ tự động đôn người chờ đầu tiên vào danh sách chính thức và gửi thông báo qua App.',
      },
    ],
  },
  {
    id: 'safety',
    category: 'safety',
    title: '3. Trang Phục, Vệ Sinh & An Toàn Thiết Bị',
    icon: Dumbbell,
    color: '#ec4899',
    summary: 'Bảo vệ sức khỏe cá nhân, an toàn cơ xương khớp và tôn trọng tài sản chung của phòng tập.',
    rules: [
      {
        title: 'Trang phục & Giày thể thao bắt buộc',
        detail: 'Phải mặc trang phục thể thao lịch sự, co giãn, thấm hút mồ hôi. Bắt buộc mang giày thể thao có đế sạch và độ bám tốt. Nghiêm cấm đi chân trần, dép lê, sandal hoặc mang giày cao gót vào sàn tập.',
        important: true,
      },
      {
        title: 'Quy tắc khăn tập cá nhân',
        detail: 'Mỗi hội viên bắt buộc mang theo khăn tập cá nhân để trải trên ghế tập, đệm máy và lau mồ hôi sau khi sử dụng thiết bị.',
      },
      {
        title: 'Trả tạ về giá và tháo đĩa tạ sau khi tập',
        detail: 'Sau khi hoàn thành bài tập với tạ đơn (Dumbbell) hoặc tạ đòn (Barbell), hội viên phải cất tạ về đúng vị trí quy định và tháo hết đĩa tạ khỏi thanh đòn cho người tập kế tiếp.',
        important: true,
      },
      {
        title: 'Tuyệt đối không quăng, ném tạ mạnh xuống sàn',
        detail: 'Kiểm soát tạ trong suốt chuyển động hạ xuống. Không được thả rơi tự do hoặc quăng tạ mạnh gây nứt sàn cao su, cong thanh đòn và nguy hiểm cho người xung quanh.',
        penalty: 'Bồi thường chi phí sửa chữa/thay mới thiết bị nếu cố tình làm rơi gãy.',
      },
      {
        title: 'Sử dụng kẹp khóa tạ (Collar Clamps)',
        detail: 'Bắt buộc dùng kẹp khóa hai đầu thanh đòn khi nâng tạ nặng (đặc biệt các bài Bench Press, Squat, Overhead Press) để chống trượt đĩa tạ gây mất thăng bằng.',
      },
    ],
  },
  {
    id: 'freeze',
    category: 'freeze',
    title: '4. Quy định Bảo Lưu (Freeze) Gói Tập',
    icon: Snowflake,
    color: '#0284c7',
    summary: 'Hỗ trợ hội viên khi đi công tác, du lịch dài ngày, ốm đau hoặc lý do sức khỏe chính đáng.',
    rules: [
      {
        title: 'Điều kiện nộp đơn bảo lưu',
        detail: 'Chỉ áp dụng cho các gói tập có hỗ trợ bảo lưu (thường từ gói 3 tháng trở lên) và tài khoản đang ở trạng thái hoạt động bình thường, không nợ phí.',
      },
      {
        title: 'Thời gian bảo lưu tối thiểu & tối đa',
        detail: 'Mỗi lần bảo lưu tối thiểu 7 ngày và tối đa theo hạn mức được ghi trong hợp đồng gói tập (ví dụ gói VIP tối đa 60 ngày/năm chia làm 2 lần).',
      },
      {
        title: 'Thời hạn gửi yêu cầu',
        detail: 'Đơn yêu cầu bảo lưu phải được tạo trên ứng dụng trước ngày bắt đầu bảo lưu ít nhất 24 giờ. Lễ tân/Quản trị viên sẽ phê duyệt trong vòng 12 giờ làm việc.',
      },
      {
        title: 'Tự động kích hoạt lại',
        detail: 'Hạn thẻ sẽ được gia hạn thêm đúng số ngày bảo lưu thực tế. Thẻ sẽ tự động mở lại khi hết thời hạn bảo lưu hoặc khi hội viên thực hiện check-in sớm.',
      },
    ],
  },
  {
    id: 'etiquette',
    category: 'etiquette',
    title: '5. Văn Hóa Ứng Xử & Bảo Quản Tài Sản',
    icon: ShieldAlert,
    color: '#f59e0b',
    summary: 'Xây dựng môi trường tập luyện văn minh, tích cực và tôn trọng lẫn nhau.',
    rules: [
      {
        title: 'Chia sẻ thiết bị trong giờ cao điểm',
        detail: 'Không ngồi ôm điện thoại trên máy tập trong lúc nghỉ giữa hiệp. Hãy sẵn sàng luân phiên hiệp tập (work-in) với hội viên khác khi phòng tập đông người.',
      },
      {
        title: 'Tôn trọng quyền riêng tư khi chụp ảnh/quay phim',
        detail: 'Được phép quay video ghi lại kỹ thuật tập cá nhân, nhưng không được hướng ống kính vào người khác khi chưa có sự đồng ý hoặc phát trực tiếp gây phản cảm.',
        important: true,
      },
      {
        title: 'Bảo quản tư trang trong tủ đồ cá nhân (Locker)',
        detail: 'Hội viên gửi đồ dùng cá nhân vào tủ khóa locker và tự giữ chìa khóa/thẻ từ trong suốt buổi tập. Phòng gym không chịu trách nhiệm với trang sức quý hoặc tiền mặt lớn để trong tủ.',
      },
      {
        title: 'Cấm giao dịch huấn luyện viên không được cấp phép',
        detail: 'Nghiêm cấm các cá nhân tự ý hướng dẫn, thu phí huấn luyện (Personal Training) cho hội viên khác khi không phải là nhân viên HLV hợp đồng của DFGymCenter.',
        penalty: 'Thu hồi thẻ hội viên ngay lập tức đối với người tổ chức dạy chui.',
        important: true,
      },
    ],
  },
];

export function GymRules() {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filteredSections = GYM_RULES_DATA.filter((sec) => {
    if (activeTab !== 'all' && sec.category !== activeTab) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      sec.title.toLowerCase().includes(q) ||
      sec.summary.toLowerCase().includes(q) ||
      sec.rules.some((r) => r.title.toLowerCase().includes(q) || r.detail.toLowerCase().includes(q))
    );
  });

  return (
    <>
      <PageHead
        title="Nội Quy & Quy Định Phòng Gym"
        desc="Bộ quy chuẩn vận hành nhằm xây dựng môi trường tập luyện an toàn, văn minh và chuyên nghiệp tại DFGymCenter."
        actions={
          <div className="badge b-purple row" style={{ padding: '8px 14px', fontSize: 13 }}>
            <FileCheck size={16} /> Áp dụng toàn hệ thống 2026
          </div>
        }
      />

      {/* Hero Banner Thông Điệp */}
      <div
        className="card mb24"
        style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(236, 72, 153, 0.08) 100%)',
          borderColor: 'rgba(99, 102, 241, 0.3)',
          padding: 24,
        }}
      >
        <div className="row wrap between" style={{ gap: 16 }}>
          <div style={{ maxWidth: 680 }}>
            <div className="row small bold" style={{ color: 'var(--primary)', marginBottom: 6 }}>
              <Sparkles size={16} /> CAM KẾT VÌ TRẢI NGHIỆM TẬP LUYỆN ĐỈNH CAO
            </div>
            <h2 style={{ fontSize: 20, marginBottom: 8 }}>Tập Luyện An Toàn – Tôn Trọng Không Gian Chung</h2>
            <p className="muted" style={{ lineHeight: 1.6, fontSize: 13.5 }}>
              Mỗi hội viên là một đại sứ cho lối sống thể thao tích cực. Việc tuân thủ nội quy không chỉ bảo vệ an toàn cho
              chính bạn mà còn giúp nâng cao tuổi thọ máy móc và giữ gìn năng lượng tích cực cho toàn thể cộng đồng DFGym.
            </p>
          </div>
          <div className="row wrap" style={{ gap: 10 }}>
            <div className="card" style={{ padding: '12px 18px', textAlign: 'center', minWidth: 120 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)' }}>06:00</div>
              <div className="small dim">Mở cửa sáng</div>
            </div>
            <div className="card" style={{ padding: '12px 18px', textAlign: 'center', minWidth: 120 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)' }}>22:00</div>
              <div className="small dim">Đóng cửa tối</div>
            </div>
          </div>
        </div>
      </div>

      {/* Thanh Tìm Kiếm & Tabs Bộ Lọc */}
      <div className="card mb24" style={{ padding: '16px 20px' }}>
        <div className="row wrap between" style={{ gap: 14 }}>
          <Tabs
            value={activeTab}
            onChange={setActiveTab}
            tabs={[
              { id: 'all', label: 'Tất cả quy định' },
              { id: 'checkin', label: 'Thẻ & Check-in' },
              { id: 'booking', label: 'Lịch lớp & PT' },
              { id: 'safety', label: 'An toàn & Thiết bị' },
              { id: 'freeze', label: 'Bảo lưu thẻ' },
              { id: 'etiquette', label: 'Văn hóa phòng tập' },
            ]}
          />
          <div className="input-icon" style={{ minWidth: 260 }}>
            <Search size={16} className="icon" />
            <input
              type="text"
              className="input"
              placeholder="Tìm kiếm nội quy, từ khóa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Danh Sách Các Mục Quy Định */}
      <div className="col" style={{ gap: 24 }}>
        {filteredSections.map((sec) => {
          const IconComp = sec.icon;
          return (
            <div key={sec.id} className="card" style={{ borderLeft: `4px solid ${sec.color}` }}>
              <div className="row between wrap mb16" style={{ gap: 10 }}>
                <div className="row" style={{ gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: `${sec.color}1a`,
                      color: sec.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconComp size={22} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 17 }}>{sec.title}</h2>
                    <div className="small dim">{sec.summary}</div>
                  </div>
                </div>
                <Badge color="purple" plain>
                  {sec.rules.length} điều khoản
                </Badge>
              </div>

              {/* Danh sách điều khoản con */}
              <div className="col" style={{ gap: 12 }}>
                {sec.rules.map((rule, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--surface-2)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '14px 18px',
                      border: rule.important ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border)',
                    }}
                  >
                    <div className="row between wrap" style={{ gap: 8, marginBottom: 6 }}>
                      <div className="row" style={{ gap: 8 }}>
                        {rule.important ? (
                          <AlertTriangle size={16} color="var(--red)" />
                        ) : (
                          <CheckCircle2 size={16} color="var(--green)" />
                        )}
                        <span className="bold" style={{ fontSize: 14 }}>
                          {rule.title}
                        </span>
                      </div>
                      {rule.important && <Badge color="red">Bắt buộc tuân thủ</Badge>}
                    </div>

                    <p className="muted" style={{ lineHeight: 1.6, fontSize: 13.5, marginLeft: 24 }}>
                      {rule.detail}
                    </p>

                    {rule.penalty && (
                      <div
                        className="row small mt8"
                        style={{
                          marginLeft: 24,
                          color: '#f87171',
                          background: 'rgba(239, 68, 68, 0.08)',
                          padding: '6px 12px',
                          borderRadius: 6,
                          width: 'fit-content',
                        }}
                      >
                        ⚠️ <strong>Chế tài vi phạm:</strong> {rule.penalty}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {filteredSections.length === 0 && (
          <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <BookOpen size={40} className="dim" style={{ margin: '0 auto 12px' }} />
            <h3>Không tìm thấy nội quy phù hợp</h3>
            <p className="muted small mt8">Hãy thử tìm với từ khóa khác như "giày", "hủy", "thẻ", "tạ"...</p>
          </div>
        )}
      </div>

      {/* Cam Kết & Trợ Giúp */}
      <div
        className="card mt24"
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          padding: 20,
        }}
      >
        <div className="row between wrap" style={{ gap: 14 }}>
          <div className="row" style={{ gap: 12 }}>
            <Clock size={20} className="dim" />
            <div className="small muted">
              Mọi thắc mắc hoặc khiếu nại về nội quy phòng tập, vui lòng liên hệ quầy Lễ tân hoặc hotline{' '}
              <strong style={{ color: 'var(--text)' }}>1900 6868</strong> (08:00 - 21:00 hàng ngày).
            </div>
          </div>
          <button
            className="btn sm"
            onClick={() => window.print()}
            title="In hoặc tải về bản quy định"
          >
            In nội quy phòng gym
          </button>
        </div>
      </div>
    </>
  );
}

