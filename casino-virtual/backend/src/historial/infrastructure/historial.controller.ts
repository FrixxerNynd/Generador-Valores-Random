import { Controller, Get, Param, Query } from '@nestjs/common';
import { GetHistoryService } from '../application/get-history.service';
import { GetUserHistoryService } from '../application/get-user-history.service';
import { GetHistoryFilterDto } from '../domain/dto/get-history-filter.dto';

@Controller('history')
export class HistorialController {
  constructor(
    private readonly getHistoryService: GetHistoryService,
    private readonly getUserHistoryService: GetUserHistoryService,
  ) {}

  @Get()
  async getHistory(@Query() filters: GetHistoryFilterDto) {
    return await this.getHistoryService.execute(filters);
  }

  @Get(':user_id')
  async getUserHistory(
    @Param('user_id') userId: string,
    @Query() filters: GetHistoryFilterDto,
  ) {
    return await this.getUserHistoryService.execute(userId, filters);
  }
}
