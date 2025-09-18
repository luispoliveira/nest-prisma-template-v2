import { Prisma, PrismaClient } from '@gen/prisma-client';
import { DefaultArgs } from '@prisma/client/runtime/library';

export type PrismaTx = Omit<
  PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;
