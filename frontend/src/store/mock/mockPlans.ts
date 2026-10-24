import type { MembershipPlan, PTPlan } from '../../types';

export const initialMembershipPlans: MembershipPlan[] = [
  { id: 'mp_basic_cg', name: 'Basic Quận 1', durationMonths: 1, price: 550000, priority: 1, branchScope: ['br1'], freePTSessions: 0, maxFreezeTimes: 0, maxFreezeDays: 0, classBookingsPerWeek: 3, description: 'Gói tháng tiết kiệm, tập tại chi nhánh Quận 1.', benefits: ['Tập tại cơ sở Quận 1', '3 lượt lớp nhóm/tuần', 'Tủ đồ miễn phí'], color: '#3fa9ff', active: true },
  { id: 'mp_basic_q1', name: 'Basic Quận 7', durationMonths: 1, price: 600000, priority: 1, branchScope: ['br2'], freePTSessions: 0, maxFreezeTimes: 0, maxFreezeDays: 0, classBookingsPerWeek: 3, description: 'Gói tháng tiết kiệm, tập tại chi nhánh Quận 7 (Phú Mỹ Hưng).', benefits: ['Tập tại cơ sở Quận 7', '3 lượt lớp nhóm/tuần', 'Tủ đồ miễn phí'], color: '#00c2a8', active: true },
  { id: 'mp_standard', name: 'Standard 3 tháng', durationMonths: 3, price: 1500000, priority: 2, branchScope: 'all', freePTSessions: 0, maxFreezeTimes: 1, maxFreezeDays: 15, classBookingsPerWeek: 5, description: 'Tập chéo mọi chi nhánh tại TP.HCM, phù hợp người mới.', benefits: ['Tập chéo toàn hệ thống TP.HCM', '5 lượt lớp nhóm/tuần', 'Freeze 1 lần, tối đa 15 ngày'], color: '#7c5cff', active: true },
  { id: 'mp_premium', name: 'Premium 12 tháng', durationMonths: 12, price: 5200000, priority: 2, branchScope: 'all', freePTSessions: 2, maxFreezeTimes: 3, maxFreezeDays: 60, classBookingsPerWeek: 0, description: 'Cam kết dài hạn với mức giá tốt nhất.', benefits: ['Tập chéo toàn hệ thống TP.HCM', 'Không giới hạn lớp nhóm', 'Tặng 2 buổi PT', 'Freeze 3 lần, tối đa 60 ngày'], color: '#ffb020', active: true },
  { id: 'mp_vip', name: 'VIP 6 tháng', durationMonths: 6, price: 6900000, priority: 3, branchScope: 'all', freePTSessions: 6, maxFreezeTimes: 2, maxFreezeDays: 30, classBookingsPerWeek: 0, description: 'Trải nghiệm cao cấp, ưu tiên cao nhất khi xếp lớp.', benefits: ['Tập chéo toàn hệ thống TP.HCM', 'Không giới hạn lớp nhóm', 'Tặng 6 buổi PT 1-kèm-1', 'Ưu tiên cao nhất danh sách chờ', 'Freeze 2 lần, tối đa 30 ngày', 'Khăn & nước miễn phí'], color: '#ff5c8a', active: true },
];

export const initialPTPlans: PTPlan[] = [
  { id: 'pt5', name: 'PT Starter 5 buổi', sessions: 5, validityDays: 30, price: 1750000, branchScope: 'all', description: 'Làm quen kỹ thuật, xây dựng giáo án cá nhân.', active: true },
  { id: 'pt10', name: 'PT Pro 10 buổi', sessions: 10, validityDays: 60, price: 3200000, branchScope: 'all', description: 'Lộ trình giảm mỡ/tăng cơ trong 2 tháng.', active: true },
  { id: 'pt20', name: 'PT Elite 20 buổi', sessions: 20, validityDays: 120, price: 5800000, branchScope: 'all', description: 'Thay đổi toàn diện, theo sát dinh dưỡng.', active: true },
  { id: 'pt8_q1', name: 'PT Boxing Quận 7 (8 buổi)', sessions: 8, validityDays: 45, price: 2600000, branchScope: ['br2'], description: 'Chuyên sâu Boxing & Kickfit tại cơ sở Quận 7.', active: true },
];
