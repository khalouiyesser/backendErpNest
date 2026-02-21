import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ChargesService } from './charges.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Charges')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('charges')
export class ChargesController {
  constructor(private readonly chargesService: ChargesService) {}
  @Post() create(@Body() dto: any, @Request() req) { return this.chargesService.create(dto, req.user.userId); }
  @Get() findAll(@Request() req, @Query('search') search?: string, @Query('type') type?: string, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string, @Query('sortBy') sortBy?: string, @Query('sortOrder') sortOrder?: 'asc'|'desc') { return this.chargesService.findAll(req.user.userId, { search, type, startDate, endDate, sortBy, sortOrder }); }
  @Get(':id') findOne(@Param('id') id: string, @Request() req) { return this.chargesService.findOne(id, req.user.userId); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: any, @Request() req) { return this.chargesService.update(id, req.user.userId, dto); }
  @Delete(':id') remove(@Param('id') id: string, @Request() req) { return this.chargesService.remove(id, req.user.userId); }
}
