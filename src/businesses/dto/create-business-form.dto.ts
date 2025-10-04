import { IsString, IsNotEmpty, IsUrl, IsEmail, Matches } from 'class-validator';
export class CreateBusinessFormDto {
  @IsString()
  @IsNotEmpty()
  storeName: string;

  @IsEmail()
  @IsNotEmpty()
  storeMail: string;

  @IsString()
  @IsNotEmpty()
  storeAddress: string;

  @Matches(
    /^(?:\+84|0)(?:3[2-9]|5[6|8|9]|7[0|6-9]|8[1-5]|9[0-4|6-9])[0-9]{7}$/,
    {
      message: 'storePhone must be a valid Vietnamese phone number',
    },
  )
  @IsString()
  @IsNotEmpty()
  storePhone: string;

  @IsString()
  @IsNotEmpty()
  taxCode: string;

  @IsUrl()
  @IsNotEmpty()
  foodLicenseUrl: string;

  @IsUrl()
  @IsNotEmpty()
  businessLicenseUrl: string;
}
