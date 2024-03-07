import { BadRequestException } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import httpMocks from 'node-mocks-http';
import { IVerifiedRequest } from 'src/interfaces/request.interface';
import { UserService } from 'src/services/user.service';
import { FindUserMiddleware } from './findUser.middleware';
import { NextFunction, Response } from 'express';
import { PrismaService } from 'src/services/prisma.service';

describe('FindUserMiddleware', () => {
  let middleware: FindUserMiddleware;
  let userService: UserService;
  let req: IVerifiedRequest;
  let res: Response;
  let next: NextFunction;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FindUserMiddleware, UserService, PrismaService],
    }).compile();

    req = httpMocks.createRequest({
      headers: {
        authorization: 'Bearer token',
      },
      body: {
        payload: {
          uuidKey: '1234',
        },
      },
    });
    res = httpMocks.createResponse();
    next = jest.fn() as NextFunction;
    middleware = module.get<FindUserMiddleware>(FindUserMiddleware);
    userService = module.get<UserService>(UserService);
  });

  // Test if the middleware is defined
  it('should be defined', () => {
    expect(middleware).toBeDefined();
    expect(userService).toBeDefined();
  });

  /**
   * Success handling
   * Test if the middleware is successfully done
   */
  it('should find user', async () => {
    const userId = 1;
    const read = jest.fn().mockResolvedValue(userId);
    userService.read = read;
    await middleware.use(req, res, next);
    expect(req.body).toEqual({
      payload: {
        uuidKey: '1234',
      },
      userId,
    });
    expect(next).toHaveBeenCalled();
  });

  /**
   * Failure handling
   * Test if the middleware is throwing error
   */
  it('should throw error if user is not found', async () => {
    const read = jest.fn().mockRejectedValue(new Error());
    userService.read = read;
    await middleware.use(req, res, next);
    expect(next).toHaveBeenCalledWith(new BadRequestException('Invalid token'));
  });
});
