/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthModule } from '../src/auth/auth.module';
import { InMemoryAuthRepository } from '../src/auth/auth.module';

describe('Auth Endpoints (e2e)', () => {
  let app: INestApplication<App>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let authToken: string;
  let authRepository: InMemoryAuthRepository;
  const testUser = {
    name: 'John',
    lastName: 'Doe',
    email: 'john@test.com',
    password: 'Password123!',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthModule],
    })
      .overrideProvider('CreateWalletUseCase')
      .useValue({
        execute: jest.fn().mockResolvedValue({ coins: 0, credits: 100 }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Get the in-memory repository for cleanup
    authRepository = moduleFixture.get<InMemoryAuthRepository>(
      InMemoryAuthRepository,
    );
  });

  beforeEach(() => {
    // Clear the in-memory database before each test for isolation
    if (authRepository) {
      authRepository.clearAll();
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email', testUser.email);
      expect(response.body).toHaveProperty('name', testUser.name);
      expect(response.body).not.toHaveProperty('password');

      // wallet info should be returned and initialized
      expect(response.body).toHaveProperty('wallet');
      expect(response.body.wallet).toEqual({ coins: 0, credits: 100 });
    });

    it('should fail if email is already registered', async () => {
      // Register first user
      await request(app.getHttpServer()).post('/auth/register').send({
        name: 'Jane',
        lastName: 'Smith',
        email: 'jane@test.com',
        password: 'Password123!',
      });

      // Try to register with same email
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Jane Duplicate',
          lastName: 'Smith',
          email: 'jane@test.com',
          password: 'Password123!',
        })
        .expect(400);

      expect(response.body.message).toContain(
        'correo electrónico ya está registrado',
      );
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Bob',
          lastName: 'Johnson',
          email: 'invalid-email',
          password: 'Password123!',
        })
        .expect(400);

      expect(response.body.message).toContain(
        'correo electrónico no es válido',
      );
    });

    it('should fail with password too short', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Bob',
          lastName: 'Johnson',
          email: 'bob@test.com',
          password: '123',
        })
        .expect(400);

      expect(response.body.message).toContain(
        'contraseña debe tener al menos 6 caracteres',
      );
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@test.com',
          password: 'Password123!',
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should fail with name too short', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'A',
          lastName: 'Doe',
          email: 'test@test.com',
          password: 'Password123!',
        })
        .expect(400);

      expect(response.body.message).toContain(
        'nombre debe tener al menos 2 caracteres',
      );
    });
  });

  describe('POST /auth/login', () => {
    beforeAll(async () => {
      // Register a test user for login tests
      await request(app.getHttpServer()).post('/auth/register').send({
        name: 'Login',
        lastName: 'Test',
        email: 'logintest@test.com',
        password: 'Password123!',
      });
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'logintest@test.com',
          password: 'Password123!',
        })
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(typeof response.body.access_token).toBe('string');
      authToken = response.body.access_token;
    });

    it('should fail with invalid email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'Password123!',
        })
        .expect(401);

      expect(response.body.message).toContain('Credenciales inválidas');
    });

    it('should fail with wrong password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'logintest@test.com',
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.message).toContain('Credenciales inválidas');
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
        })
        .expect(400);

      expect(response.body.message).toContain(
        'correo electrónico no es válido',
      );
    });

    it('should fail with missing credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'logintest@test.com',
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('PATCH /auth/profile', () => {
    let profileAuthToken: string;

    beforeAll(async () => {
      // Register a test user for profile tests
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Profile',
          lastName: 'Test',
          email: 'profiletest@test.com',
          password: 'Password123!',
        });

      // Login to get token
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'profiletest@test.com',
          password: 'Password123!',
        });

      profileAuthToken = loginResponse.body.access_token;
    });

    it('should update profile successfully with valid token', async () => {
      const response = await request(app.getHttpServer())
        .patch('/auth/profile')
        .set('Authorization', `Bearer ${profileAuthToken}`)
        .send({
          name: 'Updated Name',
          lastName: 'Updated Last Name',
        })
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Updated Name');
      expect(response.body.lastName).toBe('Updated Last Name');
    });

    it('should update email successfully', async () => {
      const response = await request(app.getHttpServer())
        .patch('/auth/profile')
        .set('Authorization', `Bearer ${profileAuthToken}`)
        .send({
          email: 'newemail@test.com',
        })
        .expect(200);

      expect(response.body.email).toBe('newemail@test.com');
    });

    it('should update password successfully', async () => {
      const response = await request(app.getHttpServer())
        .patch('/auth/profile')
        .set('Authorization', `Bearer ${profileAuthToken}`)
        .send({
          password: 'NewPassword123!',
        })
        .expect(200);

      expect(response.body).toHaveProperty('id');

      // Verify new password works for login
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: (response.body as { email: string }).email,
          password: 'NewPassword123!',
        })
        .expect(201);

      expect(loginResponse.body).toHaveProperty('access_token');
    });

    it('should fail without authorization token', async () => {
      const response = await request(app.getHttpServer())
        .patch('/auth/profile')
        .send({
          name: 'No Auth',
        })
        .expect(401);

      expect(response.body.message).toContain('Token no proporcionado');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app.getHttpServer())
        .patch('/auth/profile')
        .set('Authorization', 'Bearer invalid_token')
        .send({
          name: 'No Auth',
        })
        .expect(401);

      expect(response.body.message).toContain('Token inválido');
    });

    it('should fail with malformed authorization header', async () => {
      const response = await request(app.getHttpServer())
        .patch('/auth/profile')
        .set('Authorization', `Invalid ${profileAuthToken}`)
        .send({
          name: 'No Auth',
        })
        .expect(401);

      expect(response.body.message).toContain('Formato de token inválido');
    });

    it('should partially update profile with only some fields', async () => {
      const response = await request(app.getHttpServer())
        .patch('/auth/profile')
        .set('Authorization', `Bearer ${profileAuthToken}`)
        .send({
          name: 'Only Name Updated',
        })
        .expect(200);

      expect(response.body.name).toBe('Only Name Updated');
      expect(response.body).toHaveProperty('email');
    });

    it('should fail if email is already in use by another user', async () => {
      // Create another user
      await request(app.getHttpServer()).post('/auth/register').send({
        name: 'Another',
        lastName: 'User',
        email: 'another@test.com',
        password: 'Password123!',
      });

      // Try to update profile with existing email
      const response = await request(app.getHttpServer())
        .patch('/auth/profile')
        .set('Authorization', `Bearer ${profileAuthToken}`)
        .send({
          email: 'another@test.com',
        })
        .expect(400);

      expect(response.body.message).toContain(
        'correo electrónico ya está en uso',
      );
    });
  });
});
