import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReturnsService } from './returns.service';
import { ReturnStatus } from './return.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Returns')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('returns')
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}
  @Post() create(@Body() dto: any, @Request() req) { return this.returnsService.create(dto, req.user.userId, req.user.name, req.user.companyId); }
  @Get() findAll(@Request() req, @Query('status') status?: string, @Query('search') search?: string) { return this.returnsService.findAll(req.user.companyId, { status, search }); }
  @Get(':id') findOne(@Param('id') id: string, @Request() req) { return this.returnsService.findOne(id, req.user.companyId); }
  @Patch(':id/approve') approve(@Param('id') id: string, @Request() req) { return this.returnsService.updateStatus(id, req.user.companyId, ReturnStatus.APPROVED); }
  @Patch(':id/refund') refund(@Param('id') id: string, @Request() req) { return this.returnsService.updateStatus(id, req.user.companyId, ReturnStatus.REFUNDED); }
  @Patch(':id/reject') reject(@Param('id') id: string, @Request() req) { return this.returnsService.updateStatus(id, req.user.companyId, ReturnStatus.REJECTED); }
  @Delete(':id') remove(@Param('id') id: string, @Request() req) { return this.returnsService.remove(id, req.user.companyId); }
}
