// jest.setup.env.js — sets required env vars before any module is imported
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.DATABASE_URL = 'postgresql://benocode:benocode_dev_password@localhost:5432/benocode';
process.env.JWT_SECRET = 'test-secret-key-that-is-at-least-32-chars-long!!';
process.env.JWT_EXPIRES_IN = '7d';
process.env.CSRF_SECRET = 'test-csrf-secret-that-is-at-least-32-chars!!!';
process.env.BREVO_API_KEY = 'test-brevo-api-key';
process.env.BREVO_SENDER_EMAIL = 'test@example.com';
process.env.ADMIN_EMAIL = 'admin@example.com';
process.env.CORS_ORIGIN = 'http://localhost:3000';
