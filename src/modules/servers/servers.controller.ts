import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiParam } from '@nestjs/swagger';

import { Auth } from '@common/decorators/auth.decorator.js';
import { ZodResponse } from 'nestjs-zod';

import {
  AvailableSlotsResponseDto,
  ServerDetailResponseDto,
  ServerMapResponseDto,
} from './dto/server-response.dto.js';
import { ServersService } from './servers.service.js';

@Auth()
@Controller('servers')
export class ServersController {
  constructor(private readonly serversService: ServersService) {}

  @Get('map')
  @ZodResponse({ type: ServerMapResponseDto })
  getMapMarkers() {
    return this.serversService.listMapMarkers();
  }

  @Get(':serverId')
  @ApiParam({ name: 'serverId', format: 'uuid' })
  @ZodResponse({ type: ServerDetailResponseDto })
  getDetails(@Param('serverId', new ParseUUIDPipe()) serverId: string) {
    return this.serversService.getDetails(serverId);
  }

  @Get(':serverId/slots')
  @ApiParam({ name: 'serverId', format: 'uuid' })
  @ZodResponse({ type: AvailableSlotsResponseDto })
  getAvailableSlots(@Param('serverId', new ParseUUIDPipe()) serverId: string) {
    return this.serversService.getAvailableSlots(serverId);
  }
}
