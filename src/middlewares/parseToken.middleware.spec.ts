import httpMocks from 'node-mocks-http';
import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TestingModule, Test } from '@nestjs/testing';
import { IBaseRequest } from 'src/interfaces/request.interface';
import { ParseTokenMiddleware } from './parseToken.middleware';
import { NextFunction, Response } from 'express';

describe('ParseTokenMiddleware', () => {
  let middleware: ParseTokenMiddleware;
  let jwtService: JwtService;
  let req: IBaseRequest;
  let res: Response;
  let next: NextFunction;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ParseTokenMiddleware, JwtService],
    }).compile();

    req = httpMocks.createRequest({
      headers: {
        authorization: 'Bearer token',
      },
    });
    res = httpMocks.createResponse();
    next = jest.fn() as NextFunction;
    middleware = module.get<ParseTokenMiddleware>(ParseTokenMiddleware);
    jwtService = module.get<JwtService>(JwtService);
  });

  // Test if the middleware is defined
  it('should be defined', () => {
    expect(middleware).toBeDefined();
    expect(jwtService).toBeDefined();
  });

  /**
   * Success handling
   * Test if the middleware is successfully done
   */
  it('should parse token', async () => {
    req.method = 'POST';
    const verifyAsync = jest.fn().mockResolvedValue({ uuidKey: '1234' });
    jwtService.verifyAsync = verifyAsync;
    await middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  /**
   * Failure handling
   * Test if the middleware is throwing error
   */
  it('should throw error if token is invalid', async () => {
    req.method = 'POST';
    const verifyAsync = jest.fn().mockRejectedValue(new Error());
    jwtService.verifyAsync = verifyAsync;
    await middleware.use(req, res, next);
    expect(next).toHaveBeenCalledWith(new BadRequestException('Invalid token'));
  });

  it('should throw error if token is missing', async () => {
    req.headers.authorization = '';
    await middleware.use(req, res, next);
    expect(next).toHaveBeenCalledWith(
      new BadRequestException('Authorization header is missing'),
    );
  });
});
