import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import { OcrService } from './ocr.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('OCR')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('ocr')
export class OcrController {
  constructor(private readonly ocrService: OcrService) {}

  @Get('status')
  @ApiOperation({ summary: 'Quota OCR restant ce mois (400/mois par company)' })
  getStatus(@Request() req) { return this.ocrService.getOcrStatus(req.user.companyId); }

  @Post('analyze/url')
  @ApiOperation({ summary: 'Analyser une facture via URL — retourne champs pré-remplis pour charge (aucune charge créée)' })
  @ApiBody({ schema: { properties: { imageUrl: { type: 'string', example: 'https://example.com/facture.jpg' } } } })
  analyzeFromUrl(@Body() body: { imageUrl: string }, @Request() req) {
    return this.ocrService.analyzeFromUrl(body.imageUrl, req.user.companyId);
  }

  @Post('analyze/base64')
  @ApiOperation({ summary: 'Analyser une facture en base64 — retourne champs pré-remplis (aucune charge créée)' })
  @ApiBody({ schema: { properties: { base64: { type: 'string' }, mimeType: { type: 'string', example: 'image/jpeg' } } } })
  analyzeFromBase64(@Body() body: { base64: string; mimeType: string }, @Request() req) {
    return this.ocrService.analyzeFromBase64(body.base64, body.mimeType, req.user.companyId);
  }
}
