import {
  BadRequestException,
  HttpException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AppLogger } from './app-logger.service';
import { HttpExceptionFilter } from './http-exception.filter';

function makeHost(method = 'GET', url = '/test') {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const response = { status };
  const request = { method, url };

  return {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
    json,
    status,
  };
}

describe('HttpExceptionFilter', () => {
  const logger = { record: jest.fn() } as unknown as AppLogger;
  const filter = new HttpExceptionFilter(logger);

  it('returns 404 for NotFoundException', () => {
    const host = makeHost();
    filter.catch(new NotFoundException('Recurso não encontrado'), host as never);
    expect(host.status).toHaveBeenCalledWith(404);
  });

  it('returns 400 for BadRequestException', () => {
    const host = makeHost();
    filter.catch(new BadRequestException('Dados inválidos'), host as never);
    expect(host.status).toHaveBeenCalledWith(400);
  });

  it('returns 401 for UnauthorizedException', () => {
    const host = makeHost();
    filter.catch(new UnauthorizedException(), host as never);
    expect(host.status).toHaveBeenCalledWith(401);
  });

  it('returns 500 for generic Error', () => {
    const host = makeHost();
    filter.catch(new Error('Unexpected'), host as never);
    expect(host.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
  });

  it('returns 500 for non-Error unknown throw', () => {
    const host = makeHost();
    filter.catch('string-error', host as never);
    expect(host.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
  });

  it('includes timestamp in response body', () => {
    const host = makeHost();
    filter.catch(new NotFoundException(), host as never);
    const body = host.json.mock.calls[0][0] as Record<string, unknown>;
    expect(body.timestamp).toBeDefined();
    expect(new Date(body.timestamp as string).getTime()).not.toBeNaN();
  });

  it('includes path in response body', () => {
    const host = makeHost('GET', '/clients/99');
    filter.catch(new NotFoundException(), host as never);
    const body = host.json.mock.calls[0][0] as Record<string, unknown>;
    expect(body.path).toBe('/clients/99');
  });

  it('includes statusCode in response body', () => {
    const host = makeHost();
    filter.catch(new HttpException('Custom', 422), host as never);
    const body = host.json.mock.calls[0][0] as Record<string, unknown>;
    expect(body.statusCode).toBe(422);
  });
});
