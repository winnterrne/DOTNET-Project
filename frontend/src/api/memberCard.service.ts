import { request } from './apiClient';

export type MemberCardStatus = 'ACTIVE' | 'LOCKED' | 'LOST';

export interface MemberCardSummaryDto {
  id: string;
  memberId: string;
  cardCode: string;
  status: MemberCardStatus;
}

export interface MemberCardDto {
  id: string;
  memberId: string;
  userId: string;
  cardCode: string;
  status: MemberCardStatus;
  memberName: string;
  memberEmail: string;
  memberPhone?: string;
  userStatus: 'ACTIVE' | 'LOCKED';
  memberCreatedAt: string;
  currentPlanName?: string;
  membershipStatus?: string;
  planStartDate?: string;
  planEndDate?: string;
  allCards?: MemberCardSummaryDto[];
}

export interface IssueCardRequest {
  memberId: string;
  previousCardStatus?: 'LOCKED' | 'LOST';
  reason?: string;
}

export interface UpdateCardStatusRequest {
  status: MemberCardStatus;
  reason?: string;
}

export const memberCardService = {
  /**
   * Hội viên lấy thông tin thẻ hiện tại và lịch sử thẻ của mình.
   * GET /api/member-cards/me
   */
  async getMyCard(): Promise<MemberCardDto> {
    return request<MemberCardDto>('/member-cards/me');
  },

  /**
   * Lễ tân / Admin lấy danh sách thẻ hội viên (lọc theo memberId, từ khóa hoặc trạng thái).
   * GET /api/member-cards?memberId=
   */
  async getMemberCards(params?: {
    memberId?: string;
    search?: string;
    status?: string;
  }): Promise<MemberCardDto[]> {
    const qs = new URLSearchParams();
    if (params?.memberId) qs.set('memberId', params.memberId);
    if (params?.search) qs.set('search', params.search);
    if (params?.status && params.status !== 'ALL') qs.set('status', params.status);
    const queryStr = qs.toString();
    return request<MemberCardDto[]>(`/member-cards${queryStr ? `?${queryStr}` : ''}`);
  },

  /**
   * Lễ tân cấp thẻ mới cho hội viên (sinh Card_Code ngẫu nhiên, duy nhất; thẻ cũ chuyển LOCKED/LOST).
   * POST /api/member-cards/issue
   */
  async issueCard(payload: IssueCardRequest): Promise<MemberCardDto> {
    return request<MemberCardDto>('/member-cards/issue', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Cập nhật trạng thái thẻ (ACTIVE / LOCKED / LOST).
   * PATCH /api/member-cards/{id}/status
   */
  async updateCardStatus(
    cardId: string,
    payload: UpdateCardStatusRequest,
  ): Promise<MemberCardDto> {
    return request<MemberCardDto>(`/member-cards/${cardId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
};
