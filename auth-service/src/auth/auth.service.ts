import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Account } from './entities/account.entity.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.accountRepository.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const account = this.accountRepository.create({ ...dto, passwordHash });
    const saved = await this.accountRepository.save(account);

    const { passwordHash: _, ...result } = saved;
    return result;
  }

  async login(dto: LoginDto) {
    const account = await this.accountRepository.findOne({ where: { email: dto.email } });
    if (!account) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, account.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const token = this.jwtService.sign({ sub: account.id, email: account.email });
    return { access_token: token };
  }
}
