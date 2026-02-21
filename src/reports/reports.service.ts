import { Injectable } from '@nestjs/common';
import { PurchasesService } from '../purchases/purchases.service';
import { ChargesService } from '../charges/charges.service';
import { ProductsService } from '../products/products.service';
import {VentesService} from "../sales/ventes.service";

@Injectable()
export class ReportsService {
  constructor(
    private VenteService: VentesService,
    private purchasesService: PurchasesService,
    private chargesService: ChargesService,
    private productsService: ProductsService,
  ) {}

  async getVentesReport(userId: string, query?: any) {
    return this.VenteService.findAll(userId, query);
  }

  async getPurchasesReport(userId: string, query?: any) {
    return this.purchasesService.findAll(userId, query);
  }

  async getChargesReport(userId: string, query?: any) {
    return this.chargesService.findAll(userId, query);
  }

  async getStockReport(userId: string) {
    return this.productsService.findAll(userId);
  }
}
