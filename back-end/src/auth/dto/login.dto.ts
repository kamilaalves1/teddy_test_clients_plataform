import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'kamila.alves@empresa.com.br' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'senha-segura-123' })
  @IsString()
  @MinLength(3)
  password!: string;
}
