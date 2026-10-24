export type EquipmentStatus = 'active' | 'broken' | 'repairing' | 'retired';

export interface Equipment {
  id: string;
  branchId: string;
  name: string;
  category: string;
  code: string;
  status: EquipmentStatus;
  addedAt: string;
}

export type ReportStatus = 'pending' | 'in_progress' | 'resolved' | 'rejected';

export interface EquipmentReport {
  id: string;
  equipmentId: string;
  branchId: string;
  reporterId: string;
  description: string;
  status: ReportStatus;
  createdAt: string;
  updates: { at: string; by: string; note: string; status: ReportStatus }[];
}
