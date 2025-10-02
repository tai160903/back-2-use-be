import {
  IsString,
  IsNotEmpty,
  IsPhoneNumber,
  IsUrl,
  IsEmail,
} from 'class-validator';
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

  @IsPhoneNumber('VN')
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
