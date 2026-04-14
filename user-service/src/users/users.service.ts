import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  @InjectRepository(User)
  private readonly userRepository: Repository<User>
  async create(createUserDto: CreateUserDto) {
    const existing = await this.userRepository.findOne({                                                                               
      where: { email: createUserDto.email }             
    });                                                                                                                                
    if (existing) {
      throw new ConflictException('User with this email already exists');                                                              
    }
    return await this.userRepository.save(this.userRepository.create(createUserDto))
  }

  async findAll() {
    return await this.userRepository.find()
  }

  async findOne(id: string) {
    return await this.userRepository.findOne({
      where: {
        id,
      },
    });
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: string) {
    return `This action removes a #${id} user`;
  }
}
