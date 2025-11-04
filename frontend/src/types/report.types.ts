// 举报相关类型定义

export interface CreateReportData {
  reported_user_id: number;
  reason: string;
  description?: string;
}

export interface Report {
  id: number;
  reporter_id: number;
  reported_user_id: number | null;
  reason: string;
  description: string | null;
  status: 'pending' | 'reviewed' | 'resolved';
  created_at: string;
}
