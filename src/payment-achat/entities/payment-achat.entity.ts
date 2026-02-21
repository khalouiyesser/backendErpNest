import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types, Document } from "mongoose";
import { ApiProperty } from '@nestjs/swagger';

export type PaymentAchatDocument = PaymentAchat & Document;

@Schema({ timestamps: true })
export class PaymentAchat {

    @ApiProperty({ description: 'Montant du paiement' })
    @Prop({ required: true })
    amount: number;

    @ApiProperty({ description: 'Date du paiement', required: false })
    @Prop({ default: () => new Date() })
    date: Date;

    @ApiProperty({ description: 'Remarques ou notes', required: false })
    @Prop()
    note?: string;

    @ApiProperty({ description: 'ID du fournisseur' })
    @Prop({ type: Types.ObjectId, ref: 'Supplier', required: true })
    fournisseurId: Types.ObjectId;

    @ApiProperty({ description: 'ID de l’utilisateur qui enregistre le paiement' })
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @ApiProperty({ description: 'ID de l’achat lié au paiement' })
    @Prop({ type: Types.ObjectId, ref: 'Purchase', required: true })
    purchaseId: Types.ObjectId;
}

export const PaymentAchatSchema = SchemaFactory.createForClass(PaymentAchat);
