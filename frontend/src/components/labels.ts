import type { ClassBookingStatus, PTBookingStatus, EquipmentStatus, ReportStatus, Role, RequestStatus, PaymentMethod, CardStatus } from '../types';
import type { MStatus } from '../store/logic';

type L = [string, string]; // [label, color]

export const roleLabel: Record<Role, L> = {
  member: ['Hội viên', 'blue'],
  trainer: ['Huấn luyện viên', 'purple'],
  receptionist: ['Lễ tân', 'amber'],
  admin: ['Quản trị viên', 'pink'],
};

export const mStatusLabel: Record<MStatus, L> = {
  pending_payment: ['Chờ thanh toán', 'amber'],
  upcoming: ['Sắp hiệu lực', 'blue'],
  active: ['Đang hiệu lực', 'green'],
  frozen: ['Đang tạm ngưng', 'purple'],
  expired: ['Hết hạn', 'gray'],
  cancelled: ['Đã hủy', 'red'],
};

export const cbLabel: Record<ClassBookingStatus, L> = {
  booked: ['Đã đặt', 'green'],
  waitlist: ['Danh sách chờ', 'amber'],
  cancelled: ['Đã hủy', 'gray'],
  late_cancelled: ['Hủy quá hạn', 'red'],
  attended: ['Đã tham gia', 'blue'],
  no_show: ['Vắng mặt', 'red'],
  waitlist_expired: ['Lớp đã đầy', 'gray'],
  auto_cancelled: ['Hủy tự động', 'purple'],
};

export const ptbLabel: Record<PTBookingStatus, L> = {
  pending: ['Chờ HLV xác nhận', 'amber'],
  confirmed: ['Đã xác nhận', 'green'],
  rejected: ['Bị từ chối', 'red'],
  cancelled: ['Đã hủy', 'gray'],
  late_cancelled: ['Hủy quá hạn', 'red'],
  completed: ['Hoàn thành', 'blue'],
  no_show: ['Vắng mặt', 'red'],
  auto_cancelled: ['Hủy tự động', 'purple'],
};

export const eqLabel: Record<EquipmentStatus, L> = {
  active: ['Hoạt động tốt', 'green'],
  broken: ['Hỏng', 'red'],
  repairing: ['Đang sửa', 'amber'],
  retired: ['Thanh lý', 'gray'],
};

export const reportLabel: Record<ReportStatus, L> = {
  pending: ['Chờ xử lý', 'amber'],
  in_progress: ['Đang xử lý', 'blue'],
  resolved: ['Đã sửa xong', 'green'],
  rejected: ['Không xác nhận', 'gray'],
};

export const reqLabel: Record<RequestStatus, L> = {
  pending: ['Chờ duyệt', 'amber'],
  approved: ['Đã duyệt', 'green'],
  rejected: ['Từ chối', 'red'],
};

export const methodLabel: Record<PaymentMethod, string> = {
  momo: 'Ví MoMo',
  vnpay: 'VNPay',
  card: 'Thẻ quốc tế',
  banking: 'Internet Banking',
};

export const cardStatusMeta: Record<CardStatus, { label: string; color: 'green' | 'amber' | 'red'; desc: string }> = {
  ACTIVE: {
    label: 'Đang hoạt động (ACTIVE)',
    color: 'green',
    desc: 'Thẻ hợp lệ, sẵn sàng quét QR tại quầy lễ tân hoặc Kiosk.',
  },
  LOCKED: {
    label: 'Tạm khóa (LOCKED)',
    color: 'amber',
    desc: 'Thẻ đang bị tạm khóa. Không thể dùng để check-in cho đến khi Lễ tân mở khóa.',
  },
  LOST: {
    label: 'Đã báo mất (LOST)',
    color: 'red',
    desc: 'Thẻ đã báo mất và bị vô hiệu hóa vĩnh viễn. Vui lòng liên hệ Lễ tân để cấp thẻ mới.',
  },
};
