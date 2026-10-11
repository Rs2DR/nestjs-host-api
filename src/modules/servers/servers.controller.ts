import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { ZodResponse } from 'nestjs-zod';

import {
  AvailableSlotsResponseDto,
  ServerDetailResponseDto,
  ServerMapResponseDto,
} from './dto/server-response.dto.js';
import { ServersService } from './servers.service.js';

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
