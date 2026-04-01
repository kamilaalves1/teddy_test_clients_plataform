import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiCreatedResponse({
    schema: {
      example: {
        access_token: 'jwt-token-gerado-pela-api',
        name: 'Kamila Alves',
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Dados inválidos (validação)' })
  @ApiConflictResponse({ description: 'E-mail já cadastrado' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    schema: {
      example: {
        access_token: 'jwt-token-gerado-pela-api',
        name: 'Kamila Alves',
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Dados inválidos (validação)' })
  @ApiUnauthorizedResponse({ description: 'E-mail ou senha inválidos' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
