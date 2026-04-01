import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { PaginationDto } from './dto/pagination.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@ApiTags('clients')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token ausente ou inválido' })
@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @ApiCreatedResponse({
    schema: {
      example: {
        id: 12,
        name: 'Clínica Vértice',
        salary: 18500.5,
        companyValue: 980000,
        accessCount: 0,
        createdAt: '2026-04-01T15:30:00.000Z',
        updatedAt: '2026-04-01T15:30:00.000Z',
        deletedAt: null,
      },
    },
  })
  create(@Body() dto: CreateClientDto) {
    return this.clientsService.create(dto);
  }

  @Get()
  @ApiOkResponse({
    schema: {
      example: {
        data: [
          {
            id: 12,
            name: 'Clínica Vértice',
            salary: 18500.5,
            companyValue: 980000,
            accessCount: 3,
            createdAt: '2026-04-01T15:30:00.000Z',
            updatedAt: '2026-04-02T09:15:00.000Z',
            deletedAt: null,
          },
        ],
        total: 1,
        page: 1,
        limit: 16,
      },
    },
  })
  findAll(@Query() query: PaginationDto) {
    return this.clientsService.findAll(query.page, query.limit);
  }

  @Get(':id')
  @ApiOkResponse({
    schema: {
      example: {
        id: 12,
        name: 'Clínica Vértice',
        salary: 18500.5,
        companyValue: 980000,
        accessCount: 4,
        createdAt: '2026-04-01T15:30:00.000Z',
        updatedAt: '2026-04-02T09:15:00.000Z',
        deletedAt: null,
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Cliente não encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clientsService.findOne(id);
  }

  @Put(':id')
  @ApiOkResponse({
    schema: {
      example: {
        id: 12,
        name: 'Clínica Vértice Atualizada',
        salary: 21000,
        companyValue: 1020000,
        accessCount: 4,
        createdAt: '2026-04-01T15:30:00.000Z',
        updatedAt: '2026-04-02T10:00:00.000Z',
        deletedAt: null,
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Cliente não encontrado' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateClientDto) {
    return this.clientsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    schema: { example: { success: true, clientId: 1, message: 'Cliente removido com sucesso' } },
  })
  @ApiNotFoundResponse({ description: 'Cliente não encontrado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.clientsService.remove(id);
  }
}
