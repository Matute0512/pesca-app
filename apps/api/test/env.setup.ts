/**
 * Variables de entorno para tests e2e.
 * Se cargan ANTES de instanciar AppModule (setupFiles de jest).
 * Usa TEST_DATABASE_URL/TEST_REDIS_URL si están definidas.
 */

process.env['NODE_ENV'] = 'test';
process.env['DATABASE_URL'] =
  process.env['TEST_DATABASE_URL'] ??
  'postgresql://pesca:pesca_dev_password@localhost:5432/pesca_ba_test?schema=public';
process.env['REDIS_URL'] = process.env['TEST_REDIS_URL'] ?? 'redis://localhost:6379';
process.env['JWT_ACCESS_SECRET'] = 'test-access-secret-32-bytes-minimum!!';
process.env['JWT_REFRESH_SECRET'] = 'test-refresh-secret-32-bytes-minimum!!';
process.env['JWT_ACCESS_TTL'] = '15m';
process.env['JWT_REFRESH_TTL'] = '30d';
process.env['CORS_ORIGINS'] = 'http://localhost:5173';
process.env['S3_ENDPOINT'] = 'http://localhost:9000';
process.env['S3_BUCKET'] = 'pesca-ba-test';
process.env['S3_ACCESS_KEY'] = 'minioadmin';
process.env['S3_SECRET_KEY'] = 'minioadmin';
