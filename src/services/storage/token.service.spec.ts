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

  describe('issueToken', () => {
    it('should issue a token', async () => {
      await service.isseToken(mockValues.member.uuid_key, 'read');

      expect(redisService.setex).toHaveBeenCalled();
    });

    it('should issue a token', async () => {
      await service.isseToken(mockValues.member.uuid_key, 'write');

      expect(redisService.setex).toHaveBeenCalled();
    });
  });

  describe('issueReadToken', () => {
    it('should issue a read token', async () => {
      service.isseToken = jest.fn().mockResolvedValue(mockValues.randomToken);
      await service.issueReadToken(mockValues.member.uuid_key);

      expect(service.isseToken).toHaveBeenCalled();
    });
  });

  describe('issueWriteToken', () => {
    it('should issue a write token', async () => {
      service.isseToken = jest.fn().mockResolvedValue(mockValues.randomToken);
      await service.issueWriteToken(mockValues.member.uuid_key);

      expect(service.isseToken).toHaveBeenCalled();
    });
  });
});
