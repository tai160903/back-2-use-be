import { IsString, IsNotEmpty, IsEmail, Matches } from 'class-validator';
export class CreateBusinessFormDto {
  @IsString()
  @IsNotEmpty()
  businessName: string;

  @IsEmail()
  @IsNotEmpty()
  businessMail: string;

  @IsString()
  @IsNotEmpty()
  businessType: string;

  @IsString()
  @IsNotEmpty()
  businessAddress: string;

  @Matches(
    /^(?:\+84|0)(?:3[2-9]|5[6|8|9]|7[0|6-9]|8[1-5]|9[0-4|6-9])[0-9]{7}$/,
    {
      message: 'businessPhone must be a valid Vietnamese phone number',
    },
  )
  @IsString()
  @IsNotEmpty()
  businessPhone: string;

  @IsString()
  @IsNotEmpty()
  taxCode: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'openTime must be in HH:mm 24-hour format',
  })
  @IsString()
  @IsNotEmpty()
  openTime: string;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'closeTime must be in HH:mm 24-hour format',
  })
  @IsString()
  @IsNotEmpty()
  closeTime: string;
}
