import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ClientsModule } from './clients/clients.module';
import { FournisseursModule } from './fournisseurs/fournisseurs.module';
import { ProductsModule } from './products/products.module';
import { PurchasesModule } from './purchases/purchases.module';
import { StockModule } from './stock/stock.module';
import { QuotesModule } from './quotes/quotes.module';
import { ChargesModule } from './charges/charges.module';
import { EmployeesModule } from './employees/employees.module';
import { AccountingModule } from './accounting/accounting.module';
import { ReportsModule } from './reports/reports.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentAchatModule } from './payment-achat/payment-achat.module';
import { PaymentVenteModule } from './payment-vente/payment-vente.module';
import {VentesModule} from "./ventes/ventes.module";
import { ExportModule } from './export/export.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    ClientsModule,
    FournisseursModule,
    ProductsModule,
    VentesModule,
    PurchasesModule,
    StockModule,
    QuotesModule,
    ChargesModule,
    EmployeesModule,
    AccountingModule,
    ReportsModule,
    DashboardModule,
    NotificationsModule,
    PaymentAchatModule,
    PaymentVenteModule,
    ExportModule,
  ],
})
export class AppModule {}
