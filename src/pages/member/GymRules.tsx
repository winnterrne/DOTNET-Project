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
  CalendarClock,
  Award,
} from 'lucide-react';
import { PageHead, Badge, Tabs } from '../../components/ui';
import { useApp } from '../../store/AppContext';

interface RuleSection {
  id: string;
  category: 'checkin' | 'booking' | 'trainer' | 'safety' | 'freeze' | 'etiquette';
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

const GOLDEN_RULES = [
  {
    code: 'R-01',
    title: 'Quét QR Check-in chính chủ',
    desc: 'Xuất trình mã QR tại Kiosk/Lễ tân trước khi vào sàn tập. Tuyệt đối không dùng chung thẻ.',
    color: '#4f46e5',
  },
  {
    code: 'R-02',
    title: 'Giày thể thao & Khăn tập',
    desc: 'Mang giày đế sạch và khăn cá nhân trải ghế tập. Không đi chân trần hoặc dép lê.',
    color: '#0d9488',
  },
  {
    code: 'R-03',
    title: 'Cất tạ đúng vị trí sau khi tập',
    desc: 'Tháo đĩa tạ khỏi thanh đòn, trả Dumbbell về kệ và dùng kẹp khóa an toàn khi nâng nặng.',
    color: '#059669',
  },
  {
    code: 'R-04',
    title: 'Hủy lịch trước tối thiểu 2 giờ',
    desc: 'Hủy lớp nhóm hoặc ca PT trước 2 tiếng để được hoàn lượt tự động và nhường chỗ cho Waitlist.',
    color: '#d97706',
  },
  {
    code: 'R-05',
    title: 'PT mở ca chuẩn 45–90 phút',
    desc: 'HLV mở tối đa 8 ca/ngày trong giờ chi nhánh, cách hiện tại >=2h và không trùng lớp nhóm.',
    color: '#7c3aed',
  },
  {
    code: 'R-06',
    title: 'Văn minh giờ cao điểm',
    desc: 'Luân phiên thiết bị (work-in) khi phòng đông, không chiếm máy bấm điện thoại hoặc quay phim người khác.',
    color: '#dc2626',
  },
];

const GYM_RULES_DATA: RuleSection[] = [
  {
    id: 'checkin',
    category: 'checkin',
    title: '1. Quy định Thẻ Hội Viên & Check-in',
    icon: QrCode,
    color: '#4f46e5',
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
        detail: 'Hội viên chỉ được tập luyện trong khung giờ mở cửa niêm yết của chi nhánh (Thứ 2 - Chủ Nhật: 05:30 - 22:00 tùy chi nhánh). Vui lòng hoàn tất tập luyện và check-out trước giờ đóng cửa 15 phút.',
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
        title: 'Thời gian mở đặt chỗ trước & Hạn mức tuần',
        detail: 'Lớp học nhóm mở đặt chỗ trước tối đa 7 ngày (tối đa 5 lớp đang giữ chỗ/tuần/hội viên). Buổi tập PT 1-kèm-1 phải được đặt trước giờ bắt đầu tối thiểu 2 giờ để HLV kịp chuẩn bị giáo án chuyên biệt.',
      },
      {
        title: 'Thời hạn hủy lịch hợp lệ (Trước 2 tiếng)',
        detail: 'Hội viên có quyền hủy lịch hẹn lớp học hoặc ca PT trước giờ bắt đầu tối thiểu 2 tiếng. Lượt đặt hoặc buổi tập PT sẽ được hoàn trả tự động vào gói của bạn.',
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
        detail: 'Khi lớp đầy, hội viên đăng ký Waitlist sẽ được xếp thứ tự theo thời điểm đăng ký. Nếu có người hủy trước giờ học, hệ thống sẽ tự động đôn người chờ đầu tiên vào danh sách chính thức và gửi thông báo qua App.',
      },
    ],
  },
  {
    id: 'trainer',
    category: 'trainer',
    title: '3. Quy tắc Mở Khung Giờ & Lịch Dạy của PT / Trainer',
    icon: CalendarClock,
    color: '#7c3aed',
    summary: 'Quy chuẩn bắt buộc đối với Huấn luyện viên cá nhân khi đăng ký khung giờ rảnh và nhận lịch 1-kèm-1 trên hệ thống.',
    rules: [
      {
        title: 'Thời lượng ca chuẩn: 45 phút, 60 phút hoặc 90 phút',
        detail: 'Mỗi khung giờ PT mở trên hệ thống bắt buộc có thời lượng từ 45 đến 120 phút (khuyến nghị 3 mốc chuẩn 45p, 60p, 90p) để đồng bộ thời khóa biểu và đảm bảo chất lượng khởi động - tập chính - giãn cơ.',
        important: true,
      },
      {
        title: 'Nằm trong khung giờ hoạt động của Chi nhánh & Cách hiện tại tối thiểu 2 giờ',
        detail: 'HLV chỉ được tạo lịch rảnh nằm trọn trong giờ mở cửa – đóng cửa của chi nhánh công tác (ví dụ 05:30 – 22:00) và phải mở trước thời điểm bắt đầu ít nhất 2 tiếng. Không được tạo khung giờ vắt qua nửa đêm.',
        important: true,
      },
      {
        title: 'Giới hạn tối đa 8 khung giờ PT/ngày để bảo đảm thể lực huấn luyện',
        detail: 'Để đảm bảo sự tập trung và an toàn khi đỡ tạ (spotting) cho học viên, mỗi HLV chỉ được mở tối đa 8 khung giờ rảnh trong cùng một ngày.',
        important: true,
      },
      {
        title: 'Chống trùng lịch tự động (Khung giờ PT & Lớp học nhóm)',
        detail: 'Hệ thống tự động khóa và từ chối nếu khung giờ PT mới bị chồng lấn với một khung giờ PT khác hoặc trùng với tiết dạy Lớp học nhóm (Group Class) mà HLV đó đang phụ trách.',
      },
      {
        title: 'Quy định khóa/xóa khung giờ và xử lý yêu cầu đặt lịch',
        detail: 'HLV chỉ được xóa khung giờ khi chưa có hội viên đặt. Đối với khung giờ đã được xác nhận (Confirmed), HLV không thể tự ý xóa mà phải liên hệ Quản lý chi nhánh nếu có sự cố đột xuất.',
        penalty: 'HLV hủy ca đã xác nhận sát giờ không có lý do chính đáng sẽ bị trừ điểm KPI chất lượng dịch vụ tháng.',
      },
    ],
  },
  {
    id: 'safety',
    category: 'safety',
    title: '4. Trang Phục, Vệ Sinh & An Toàn Thiết Bị',
    icon: Dumbbell,
    color: '#059669',
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
    title: '5. Quy định Bảo Lưu (Freeze) Gói Tập',
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
        detail: 'Mỗi lần bảo lưu tối thiểu 7 ngày và tối đa theo hạn mức được ghi trong hợp đồng gói tập (ví dụ gói VIP tối đa 30 ngày/lần).',
      },
      {
        title: 'Tự động cộng bù ngày hết hạn',
        detail: 'Khi yêu cầu Freeze được Lễ tân phê duyệt, hạn thẻ sẽ được cộng bù đúng số ngày bảo lưu và tự động kích hoạt lại khi hội viên mở khóa hoặc hết hạn bảo lưu.',
      },
    ],
  },
  {
    id: 'etiquette',
    category: 'etiquette',
    title: '6. Văn Hóa Ứng Xử & Bảo Quản Tài Sản',
    icon: ShieldAlert,
    color: '#d97706',
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
        title: 'Cấm giao dịch huấn luyện viên không được cấp phép',
        detail: 'Nghiêm cấm các cá nhân tự ý hướng dẫn, thu phí huấn luyện (Personal Training) cho hội viên khác khi không phải là nhân viên HLV hợp đồng của DFGymCenter.',
        penalty: 'Thu hồi thẻ hội viên ngay lập tức đối với người tổ chức dạy chui.',
        important: true,
      },
    ],
  },
];

export function GymRules() {
  const { toast } = useApp();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [acknowledged, setAcknowledged] = useState<boolean>(() => {
    return localStorage.getItem('dfgym_rules_ack') === '1';
  });

  const handleAck = () => {
    localStorage.setItem('dfgym_rules_ack', '1');
    setAcknowledged(true);
    toast('Cảm ơn bạn đã xác nhận cam kết tuân thủ Nội quy DFGymCenter!', 'success');
  };

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
        title="Nội Quy Phòng Gym & Quy Chuẩn Vận Hành"
        desc="Bộ quy tắc chuẩn mực dành cho Hội viên và Huấn luyện viên (PT) nhằm đảm bảo an toàn, công bằng và văn minh."
        actions={
          <div className="row" style={{ gap: 10 }}>
            {acknowledged ? (
              <Badge color="green">
                <CheckCircle2 size={14} /> Đã cam kết tuân thủ
              </Badge>
            ) : (
              <button className="btn primary sm" onClick={handleAck}>
                <Award size={15} /> Xác nhận đã đọc nội quy
              </button>
            )}
            <div className="badge b-purple row" style={{ padding: '7px 12px', fontSize: 12.5 }}>
              <FileCheck size={15} /> Phiên bản chuẩn 2026
            </div>
          </div>
        }
      />

      {/* 6 Quy Tắc Vàng Tóm Tắt Nhanh */}
      <div className="card mb24" style={{ padding: 20 }}>
        <div className="row between wrap mb12">
          <div className="row" style={{ gap: 8 }}>
            <Sparkles size={18} color="var(--primary)" />
            <h3>6 Quy Tắc Vàng Cần Nhớ Nhanh</h3>
          </div>
          <span className="small muted">Tóm tắt cốt lõi dành cho cả Hội viên & Huấn luyện viên</span>
        </div>
        <div className="grid grid-3" style={{ gap: 12 }}>
          {GOLDEN_RULES.map((g) => (
            <div
              key={g.code}
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderLeft: `4px solid ${g.color}`,
                borderRadius: 'var(--radius-sm)',
                padding: '12px 14px',
              }}
            >
              <div className="row between mb4">
                <span className="bold" style={{ fontSize: 13.5 }}>{g.title}</span>
                <span className="mono small" style={{ color: g.color, fontWeight: 700 }}>{g.code}</span>
              </div>
              <div className="small muted" style={{ lineHeight: 1.5 }}>{g.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Thanh Tìm Kiếm & Tabs Bộ Lọc */}
      <div className="card mb24" style={{ padding: '14px 18px' }}>
        <div className="row wrap between" style={{ gap: 14 }}>
          <Tabs
            value={activeTab}
            onChange={setActiveTab}
            tabs={[
              { id: 'all', label: 'Tất cả (6 mục)' },
              { id: 'checkin', label: 'Thẻ & Check-in' },
              { id: 'booking', label: 'Đặt lịch & Hủy lịch' },
              { id: 'trainer', label: 'Quy tắc PT / Trainer' },
              { id: 'safety', label: 'An toàn & Thiết bị' },
              { id: 'freeze', label: 'Bảo lưu thẻ' },
              { id: 'etiquette', label: 'Văn hóa phòng tập' },
            ]}
          />
          <div className="input-icon" style={{ minWidth: 250 }}>
            <Search size={16} className="icon" />
            <input
              type="text"
              className="input"
              placeholder="Tìm quy định: giày, hủy lịch, PT, tạ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Danh Sách Các Mục Quy Định Chi Tiết */}
      <div className="col" style={{ gap: 20 }}>
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
                      background: `${sec.color}18`,
                      color: sec.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconComp size={21} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 16.5 }}>{sec.title}</h2>
                    <div className="small dim">{sec.summary}</div>
                  </div>
                </div>
                <Badge color="purple" plain>
                  {sec.rules.length} điều khoản
                </Badge>
              </div>

              <div className="col" style={{ gap: 10 }}>
                {sec.rules.map((rule, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--surface-2)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '13px 16px',
                      border: rule.important ? '1px solid rgba(220, 38, 38, 0.28)' : '1px solid var(--border)',
                    }}
                  >
                    <div className="row between wrap" style={{ gap: 8, marginBottom: 4 }}>
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
                          color: 'var(--red)',
                          background: 'rgba(220, 38, 38, 0.08)',
                          padding: '6px 12px',
                          borderRadius: 6,
                          width: 'fit-content',
                        }}
                      >
                        ⚠️ <strong>Chế tài xử lý:</strong> {rule.penalty}
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
            <p className="muted small mt8">Hãy thử tìm với từ khóa khác như "giày", "hủy", "thẻ", "PT", "tạ"...</p>
          </div>
        )}
      </div>

      {/* Cam Kết & Trợ Giúp */}
      <div
        className="card mt24"
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          padding: 18,
        }}
      >
        <div className="row between wrap" style={{ gap: 14 }}>
          <div className="row" style={{ gap: 12 }}>
            <Clock size={20} className="dim" />
            <div className="small muted">
              Mọi thắc mắc hoặc khiếu nại về nội quy phòng tập, vui lòng liên hệ quầy Lễ tân hoặc hotline{' '}
              <strong style={{ color: 'var(--text)' }}>1900 6868</strong> (06:00 - 22:00 hàng ngày).
            </div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            {!acknowledged && (
              <button className="btn primary sm" onClick={handleAck}>
                Tôi đã hiểu & đồng ý tuân thủ
              </button>
            )}
            <button className="btn sm" onClick={() => window.print()} title="In hoặc tải về bản quy định">
              In nội quy
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
