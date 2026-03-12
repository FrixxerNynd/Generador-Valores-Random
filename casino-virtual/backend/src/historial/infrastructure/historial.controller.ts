import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { GetHistoryService } from '../application/get-history.service';

@Controller('history')
export class HistorialController {
  constructor(private readonly getHistoryService: GetHistoryService) {}

  @Get()
  getHistory() {
    return this.getHistoryService.getUserHistory('demo_user_123');
  }

  @Get('admin/export')
  async exportAdminHistory(@Res() res: Response) {
    const csv = await this.getHistoryService.exportAdminHistoryCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="casino_historial.csv"');
    res.send(csv);
  }

  @Get('admin')
  getAdminHistory() {
    return this.getHistoryService.getAdminHistory();
  }

  @Get(':user_id')
  getUserHistory(@Param('user_id') userId: string) {
    return this.getHistoryService.getUserHistory(userId);
  }
}
