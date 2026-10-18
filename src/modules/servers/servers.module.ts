import { Module } from '@nestjs/common';

import { ServersController } from './servers.controller.js';
import { ServersRepository } from './servers.repository.js';
import { ServersService } from './servers.service.js';

@Module({
  controllers: [ServersController],
  providers: [ServersRepository, ServersService],
  exports: [ServersService, ServersRepository],
})
export class ServersModule {}
