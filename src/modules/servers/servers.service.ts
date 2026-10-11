import { Injectable, NotFoundException } from '@nestjs/common';
import type { Server } from '@infrastructure/database/schema/servers.js';

import { SERVER_ERRORS } from './servers.constants.js';
import { ServersRepository } from './servers.repository.js';

@Injectable()
export class ServersService {
  constructor(private readonly serversRepository: ServersRepository) {}

  listMapMarkers() {
    return this.serversRepository.listMapMarkers();
  }

  async getDetails(id: Server['id']) {
    const server = await this.serversRepository.findActiveById(id);

    if (!server) {
      throw new NotFoundException(SERVER_ERRORS.NOT_FOUND);
    }

    const availableSlots = await this.serversRepository.countAvailableSlots(id);

    return {
      id: server.id,
      slug: server.slug,
      name: server.name,
      description: server.description,
      locationName: server.locationName,
      latitude: server.latitude,
      longitude: server.longitude,
      cpuModel: server.cpuModel,
      cpuCores: server.cpuCores,
      ramGb: server.ramGb,
      storageGb: server.storageGb,
      storageType: server.storageType,
      bandwidthMbps: server.bandwidthMbps,
      hourlyRate: server.hourlyRate,
      currency: server.currency,
      availableSlots,
    };
  }

  async getAvailableSlots(id: Server['id']) {
    const server = await this.serversRepository.findActiveById(id);

    if (!server) {
      throw new NotFoundException(SERVER_ERRORS.NOT_FOUND);
    }

    return this.serversRepository.listAvailableSlots(id);
  }
}
