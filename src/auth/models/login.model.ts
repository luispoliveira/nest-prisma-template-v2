import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Login {
  @Field(() => String, { nullable: false })
  accessToken!: string;
  @Field(() => Int, { nullable: false })
  userId!: number;
  @Field(() => String, { nullable: false })
  email!: string;
}
