import {Document, Types} from "mongoose";
import {PaymentAchat} from "../../payment-achat/entities/payment-achat.entity";
import {ApiProperty} from "@nestjs/swagger";
import {Prop, SchemaFactory} from "@nestjs/mongoose";

export type PaymentVenteDocument = PaymentAchat & Document;

export class PaymentVente {


    @ApiProperty({ description: 'Montant du paiement' })
    @Prop({ required: true })
    amount: number;

    @ApiProperty({ description: 'Date du paiement', required: false })
    @Prop({ default: () => new Date() })
    date: Date;

    @ApiProperty({ description: 'Remarques ou notes', required: false })
    @Prop()
    note?: string;

    @ApiProperty({ description: 'ID du Client' })
    @Prop({ type: Types.ObjectId, ref: 'Client', required: true })
    clientId: Types.ObjectId;

    @ApiProperty({ description: 'ID de l’utilisateur qui enregistre le paiement' })
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;


    // entity
    @Prop({ type: Types.ObjectId, ref: 'Sale', required: false })
    saleId?: Types.ObjectId;

}

export const PaymentVenteSchema = SchemaFactory.createForClass(PaymentVente);

