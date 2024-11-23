declare global {
  namespace NodeJS {
    interface ProcessEnv {
      BASIC_AUTH_USER: string;
      BASIC_AUTH_PASSWORD: string;
      NODE_ENV: 'development' | 'production' | 'test';
    }
  }
}

export {};
