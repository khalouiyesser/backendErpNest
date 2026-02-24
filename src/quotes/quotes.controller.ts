import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { QuotesService } from './quotes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Quotes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}
  @Post() create(@Body() dto: any, @Request() req)
  {
    return this.quotesService.create(dto, req.user.userId);
  }
  @Get() findAll(@Request() req, @Query('search') search?: string, @Query('status') status?: string, @Query('sortBy') sortBy?: string, @Query('sortOrder') sortOrder?: 'asc' | 'desc')
  {
    return this.quotesService.findAll(req.user.userId, { search, status, sortBy, sortOrder });
  }
  @Get(':id') findOne(@Param('id') id: string, @Request() req)
  {
    return this.quotesService.findOne(id, req.user.userId);
  }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: any, @Request() req)
  {
    return this.quotesService.update(id, req.user.userId, dto);
  }
  @Delete(':id') remove(@Param('id') id: string, @Request() req)
  {
    return this.quotesService.remove(id, req.user.userId);
  }




}
