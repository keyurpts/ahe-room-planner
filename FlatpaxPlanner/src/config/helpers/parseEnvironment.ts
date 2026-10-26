type AppEnvironment = 'development' | 'test' | 'staging' | 'production';

export function parseEnvironment(value: string | undefined): AppEnvironment {
  switch (value) {
    case 'development':
    case 'test':
    case 'staging':
    case 'production':
      return value;
    default:
      throw new Error('VITE_APP_ENV must be development, test, staging, or production.');
  }
}