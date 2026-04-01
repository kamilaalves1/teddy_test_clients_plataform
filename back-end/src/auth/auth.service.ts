import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppLogger } from '../common/app-logger.service';
import { RequestContextService } from '../common/request-context.service';
import { MetricsService } from '../metrics/metrics.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from './user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly metricsService: MetricsService,
    private readonly logger: AppLogger,
    private readonly requestContext: RequestContextService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();

    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) {
      this.metricsService.recordRegisterFailure();
      this.logger.record('warn', {
        event: 'auth.register',
        message: 'Cadastro recusado por e-mail já existente',
        outcome: 'rejected',
        email,
        reason: 'duplicate_email',
      });
      throw new ConflictException('Este e-mail já está cadastrado.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      name: dto.name.trim(),
      email,
      passwordHash,
    });
    await this.userRepository.save(user);
    this.requestContext.patch({ userId: user.id, userEmail: user.email });
    this.metricsService.recordRegisterSuccess();
    this.logger.record('info', {
      event: 'auth.registered',
      message: 'Conta criada',
      userId: user.id,
      email: user.email,
    });

    const access_token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      name: user.name,
    });

    return { access_token, name: user.name };
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      this.metricsService.recordLoginFailure();
      this.logger.record('warn', {
        event: 'auth.login.failed',
        message: 'Tentativa de login para um e-mail inexistente',
        email,
      });
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      this.metricsService.recordLoginFailure();
      this.logger.record('warn', {
        event: 'auth.login.failed',
        message: 'Senha inválida em tentativa de login',
        userId: user.id,
        email,
      });
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    this.requestContext.patch({ userId: user.id, userEmail: user.email });
    this.metricsService.recordLoginSuccess();
    this.logger.record('info', {
      event: 'auth.logged_in',
      message: 'Sessão iniciada',
      userId: user.id,
      email: user.email,
    });

    const access_token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      name: user.name,
    });

    return { access_token, name: user.name };
  }
}
