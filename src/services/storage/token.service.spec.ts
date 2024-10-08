import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import { TokenService } from './token.service';
import mockValues from '../../../test/mockValues';

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
      const token = 'randomToken';
      const expiration = 3600;

      await service.saveToken(token, mockValues.member.uuid_key, expiration);

      expect(redisService.setex).toHaveBeenCalledWith(
        token,
        mockValues.member.uuid_key,
        expiration,
      );
    });
  });

  describe('issueReadToken', () => {
    it('should issue a read token', async () => {
      await service.issueReadToken(mockValues.member.uuid_key);

      expect(redisService.setex).toHaveBeenCalled();
    });
  });
});
