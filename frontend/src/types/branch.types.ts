export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  openTime: string; // HH:mm
  closeTime: string; // HH:mm
  rooms: string[];
  active: boolean;
}

/** 'all' = áp dụng chung mọi chi nhánh */
export type BranchScope = 'all' | string[];
