import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;

  const mockUser = {
    id: 1,
    username: 'testuser',
    password: 'hashedPassword123',
    comparePassword: jest.fn().mockReturnValue(Promise.resolve(true)),
    createdAt: new Date(),
    updatedAt: new Date(),
    articles: [],
    hashPassword: jest.fn(),
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('test.jwt.token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(jwtService).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async (): Promise<void> => {
      const registerDto = { username: 'newuser', password: 'password123' };

      const findOneMock = jest.fn().mockResolvedValue(null);
      const createMock = jest.fn().mockReturnValue(mockUser);
      const saveMock = jest.fn().mockResolvedValue(mockUser);

      userRepository.findOne = findOneMock;
      userRepository.create = createMock;
      userRepository.save = saveMock;

      const result = await service.register(registerDto);

      expect(result).toEqual({ access_token: 'test.jwt.token' });
      expect(findOneMock).toHaveBeenCalledWith({
        where: { username: registerDto.username },
      });
      expect(createMock).toHaveBeenCalled();
      expect(saveMock).toHaveBeenCalled();
    });

    it('should not register duplicate username', async (): Promise<void> => {
      const registerDto = { username: 'existinguser', password: 'password123' };
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    it('should login with correct credentials', async (): Promise<void> => {
      const loginDto = { username: 'testuser', password: 'password123' };
      const findOneMock = jest.fn().mockResolvedValue(mockUser);
      userRepository.findOne = findOneMock;
      (mockUser.comparePassword as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(result).toEqual({ access_token: 'test.jwt.token' });
      expect(findOneMock).toHaveBeenCalledWith({
        where: { username: loginDto.username },
        select: ['id', 'username', 'password'],
      });
    });

    it('should not login with wrong username', async (): Promise<void> => {
      const loginDto = { username: 'wronguser', password: 'password123' };
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should not login with wrong password', async (): Promise<void> => {
      const loginDto = { username: 'testuser', password: 'wrongpassword' };
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      (mockUser.comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
