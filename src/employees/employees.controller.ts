import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}
  @Post() create(@Body() dto: any, @Request() req) { return this.employeesService.create(dto, req.user.userId); }
  @Get() findAll(@Request() req, @Query('search') s?: string, @Query('sortBy') sb?: string, @Query('sortOrder') so?: 'asc'|'desc') { return this.employeesService.findAll(req.user.userId, { search: s, sortBy: sb, sortOrder: so }); }
  @Get(':id') findOne(@Param('id') id: string, @Request() req) { return this.employeesService.findOne(id, req.user.userId); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: any, @Request() req) { return this.employeesService.update(id, req.user.userId, dto); }
  @Delete(':id') remove(@Param('id') id: string, @Request() req) { return this.employeesService.remove(id, req.user.userId); }
}
