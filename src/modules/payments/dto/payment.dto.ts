import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentIntentDto {
  @ApiProperty({ description: 'The order ID to create a payment intent for' })
  @IsString()
  @IsNotEmpty()
  orderId: string;
}

export class InitSSLCommerzDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  orderId: string;
}
