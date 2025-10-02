import { ApiProperty } from '@nestjs/swagger';

export class Login {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  userId!: number;

  @ApiProperty()
  email!: string;
}
