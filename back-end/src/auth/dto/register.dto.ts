import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Kamila Alves' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: 'kamila.alves@empresa.com.br' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'senha-segura-123' })
  @IsString()
  @MinLength(6)
  password!: string;
}
