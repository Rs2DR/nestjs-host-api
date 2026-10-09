import { defineRelations } from 'drizzle-orm';

import * as schema from './schema/index.js';

export const relations = defineRelations(schema, (r) => ({
  users: {
    devices: r.many.userDevices(),
    rentals: r.many.rentals(),
  },

  userDevices: {
    user: r.one.users({
      from: r.userDevices.userId,
      to: r.users.id,
      optional: false,
    }),
  },

  servers: {
    rentals: r.many.rentals(),
  },

  rentals: {
    user: r.one.users({
      from: r.rentals.userId,
      to: r.users.id,
      optional: false,
    }),

    server: r.one.servers({
      from: r.rentals.serverId,
      to: r.servers.id,
      optional: false,
    }),

    payments: r.many.payments(),
  },

  payments: {
    rental: r.one.rentals({
      from: r.payments.rentalId,
      to: r.rentals.id,
      optional: false,
    }),
  },
}));
