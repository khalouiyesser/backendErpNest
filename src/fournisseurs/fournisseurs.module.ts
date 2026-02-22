import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PurchasesModule } from '../purchases/purchases.module';
import { FournisseursController } from "./fournisseurs.controller";
import { Fournisseur, FournisseurSchema } from "./fournisseur.schema";
import { FournisseursService } from "./fournisseurs.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Fournisseur.name, schema: FournisseurSchema },
    ]),
    forwardRef(() => PurchasesModule), // ✅ correction ici
  ],
  controllers: [FournisseursController],
  providers: [FournisseursService],
  exports: [FournisseursService],
})
export class FournisseursModule {}