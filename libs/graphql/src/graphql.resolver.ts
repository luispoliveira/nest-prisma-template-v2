import { CurrentUser, LoggedUser } from "@lib/auth";
import { Query, Resolver } from "@nestjs/graphql";

@Resolver()
export class GraphqlResolver {
  @Query(() => String, { name: "HelloGraphQL" })
  async hello(@CurrentUser() user: LoggedUser) {
    console.log(user);
    return `I'm working!`;
  }
}
