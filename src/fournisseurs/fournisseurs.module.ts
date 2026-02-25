import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Fournisseur, FournisseurSchema } from './fournisseur.schema';
import { FournisseursController } from './fournisseurs.controller';
import { FournisseursService } from './fournisseurs.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Fournisseur.name, schema: FournisseurSchema }])],
  controllers: [FournisseursController],
  providers: [FournisseursService],
  exports: [FournisseursService],
})
export class FournisseursModule {}
