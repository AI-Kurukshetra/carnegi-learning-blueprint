import { IsEmail, IsIn, IsNumber, IsString, Min } from 'class-validator';

export class CreateOrderDto {
  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsIn(['INR'])
  currency: string;

  @IsEmail()
  admin_email: string;

  @IsString()
  plan: string;
}
