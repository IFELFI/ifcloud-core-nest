import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis';
import { TokenService } from './token.service';

describe('TokenService', () => {
  let service: TokenService;
  let redisService: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: RedisService,
          useValue: {
            setex: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
    redisService = module.get<RedisService>(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateToken', () => {
    it('should return a generated token', async () => {
      const length = 32;
      const token = await service.generateToken(length);

      expect(token).toHaveLength(length);
    });
  });

  describe('saveToken', () => {
    it('should save a token in Redis', async () => {
      const token = 'token';
      const uuidKey = 'uuidKey';
      const expiration = 3600;

      await service.saveToken(token, uuidKey, expiration);

      expect(redisService.setex).toHaveBeenCalledWith(
        token,
        uuidKey,
        expiration,
      );
    });
  });

  describe('issueReadToken', () => {
    it('should issue a read token', async () => {
      const uuidKey = 'uuidKey';

      await service.issueReadToken(uuidKey);

      expect(redisService.setex).toHaveBeenCalled();
    });
  });
});
