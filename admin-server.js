import AdminJSExpress from '@adminjs/express';
import {Adapter, Database, Resource} from '@adminjs/sql';
import AdminJS from 'adminjs';
import Connect from 'connect-pg-simple';
import dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';
dotenv.config();

const PORT = 3030;
const DATABASE_URL = process.env.DATABASE_URL;
const SESSION_SECRET = process.env.SESSION_SECRET || 'change_this_secret';
const NODE_ENV = process.env.NODE_ENV || 'development';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

AdminJS.registerAdapter({Database, Resource});

const authenticate = async (email, password) => {
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    return Promise.resolve({email: ADMIN_EMAIL, password: ADMIN_PASSWORD});
  }
  return null;
};

const start = async () => {
  const app = express();
  const ConnectSession = Connect(session);

  const db = await new Adapter('postgresql', {
    connectionString: DATABASE_URL,
    database: 'nestjs',
  }).init();

  const adminOptions = {
    databases: [db],
    rootPath: '/admin',
  };

  const admin = new AdminJS(adminOptions);

  const sessionStore = new ConnectSession({
    conObject: {
      connectionString: DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production',
    },
    tableName: 'session',
    createTableIfMissing: true,
  });

  const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
    admin,
    {
      authenticate,
      cookieName: 'adminjs',
      cookiePassword: SESSION_SECRET,
    },
    null,
    {
      store: sessionStore,
      resave: true,
      saveUninitialized: true,
      secret: SESSION_SECRET,
      cookie: {
        httpOnly: NODE_ENV === 'production',
        secure: NODE_ENV === 'production',
      },
      name: 'adminjs',
    }
  );
  app.use(admin.options.rootPath, adminRouter);

  app.listen(PORT, () => {
    console.log(
      `AdminJS started on http://localhost:${PORT}${admin.options.rootPath}`
    );
  });
};

start().catch(error => {
  console.error('Error starting AdminJS:', error);
  process.exit(1);
});
