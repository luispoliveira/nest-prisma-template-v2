import { EnvironmentEnum } from 'src/common/enum/environment.enum';

export const configuration = () => ({
  environment: process.env.NODE_ENV || EnvironmentEnum.DEVELOPMENT,
  port: parseInt(process.env.PORT!, 10) || 3000,
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
  },
});
