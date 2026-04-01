import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, MaxLength, Min } from 'class-validator';

export class CreateClientDto {
  @ApiProperty({ example: 'Clínica Vértice' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 18500.5 })
  @IsNumber()
  @Min(0)
  salary!: number;

  @ApiProperty({ example: 980000 })
  @IsNumber()
  @Min(0)
  companyValue!: number;
}
