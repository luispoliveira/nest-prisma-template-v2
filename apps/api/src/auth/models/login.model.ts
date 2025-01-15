import { Field, Int, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

@ObjectType()
export class Login {
  @ApiProperty()
  @Field(() => String, { nullable: false })
  accessToken!: string;

  @ApiProperty()
  @Field(() => Int, { nullable: false })
  userId!: number;

  @ApiProperty()
  @Field(() => String, { nullable: false })
  email!: string;
}
