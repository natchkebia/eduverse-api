import { IsEmail, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Valid email is required' })
  email: string;

  @IsString()
  @MaxLength(72)
  password: string;
}
