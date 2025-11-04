import apiService from './apiService';
import type { CreateReportData, Report } from '../types/report.types';

const reportService = {
  /**
   * 创建举报
   */
  createReport: async (data: CreateReportData): Promise<Report> => {
    const response = await apiService.post<Report>('/api/reports', data);
    return response.data;
  },
};

export default reportService;
