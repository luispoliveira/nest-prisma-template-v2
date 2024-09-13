import {
  ApolloServerPluginLandingPageLocalDefault,
  ApolloServerPluginLandingPageProductionDefault,
} from '@apollo/server/plugin/landingPage/default';
import { EnvironmentEnum } from '@lib/common';
import { ApolloDriver } from '@nestjs/apollo';
import { DynamicModule, Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { GraphqlResolver } from './graphql.resolver';

@Module({
  providers: [GraphqlResolver],
})
export class GraphqlModule {
  static register(): DynamicModule {
    return {
      global: true,
      module: GraphqlModule,
      imports: [
        GraphQLModule.forRoot({
          debug: process.env['NODE_ENV'] === EnvironmentEnum.DEVELOPMENT,
          playground: false,
          driver: ApolloDriver,
          useGlobalPrefix: true,
          plugins:
            process.env['NODE_ENV'] === EnvironmentEnum.PRODUCTION
              ? [ApolloServerPluginLandingPageProductionDefault()]
              : [ApolloServerPluginLandingPageLocalDefault()],
          subscriptions: {
            'graphql-ws': true,
            'subscriptions-transport-ws': true,
          },
          persistedQueries: false,
          autoSchemaFile: true,
          sortSchema: true,
        }),
      ],
    };
  }
}
