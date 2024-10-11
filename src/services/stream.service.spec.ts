import { Test, TestingModule } from '@nestjs/testing';
import { TokenService } from './storage/token.service';
import { StreamService } from './stream.service';
import mockValues from '../../test/mockValues';

describe('StreamService', () => {
  let service: StreamService;
  let tokenService: TokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StreamService,
        {
          provide: TokenService,
          useValue: {
            issueReadToken: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StreamService>(StreamService);
    tokenService = module.get<TokenService>(TokenService);

    tokenService.issueReadToken = jest
      .fn()
      .mockResolvedValue(mockValues.randomToken);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('issueReadToken', () => {
    it('should issue a read token', async () => {
      const result = await service.issueReadToken(mockValues.block.file_key);

      expect(result).toBe(mockValues.randomToken);
    });
  });
});
