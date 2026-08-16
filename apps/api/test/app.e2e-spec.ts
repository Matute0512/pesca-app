import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';
import { ResponseTransformInterceptor } from '../src/common/interceptors/response.interceptor';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Tests e2e contra la API con PostgreSQL + PostGIS + Redis reales.
 * Requiere: `docker compose up -d db redis` y una DB `pesca_ba_test`.
 * El seed de acá es mínimo y controlado (no el seed demo).
 */
describe('PescaBA API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let httpServer: ReturnType<INestApplication['getHttpServer']>;

  const LA_PLATA = { lat: -34.9215, lng: -57.9545 };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('v1');
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new ResponseTransformInterceptor());
    await app.init();

    httpServer = app.getHttpServer();
    prisma = app.get(PrismaService);

    // Limpiar y sembrar datos mínimos.
    await prisma.fishingSite.deleteMany();
    await prisma.species.deleteMany();
    await prisma.user.deleteMany();

    await prisma.species.createMany({
      data: [
        { slug: 'pejerrey', commonNameEs: 'Pejerrey', scientificName: 'Odontesthes bonariensis', category: 'sport' },
        { slug: 'carpa', commonNameEs: 'Carpa', scientificName: 'Cyprinus carpio', category: 'sport' },
      ],
    });

    const species = await prisma.species.findMany();
    const pejerrey = species.find((s) => s.slug === 'pejerrey')!;

    await prisma.fishingSite.create({
      data: {
        slug: 'laguna-la-plata-demo',
        name: 'Laguna La Plata Demo',
        siteType: 'lagoon',
        latitude: LA_PLATA.lat,
        longitude: LA_PLATA.lng,
        locality: 'La Plata',
        municipality: 'La Plata',
        province: 'Buenos Aires',
        countryCode: 'ar',
        isVerified: false,
        isPublic: true,
        source: 'test',
        species: { create: [{ speciesId: pejerrey.id }] },
      },
    });

    await prisma.fishingSite.create({
      data: {
        slug: 'rio-demo-chascomus',
        name: 'Río Demo Chascomús',
        siteType: 'river',
        latitude: -35.58,
        longitude: -58.02,
        locality: 'Chascomús',
        province: 'Buenos Aires',
        countryCode: 'ar',
        isVerified: false,
        isPublic: true,
        source: 'test',
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /v1/health responde ok', async () => {
    await request(httpServer).get('/v1/health').expect(200);
  });

  it('GET /v1/sites/nearby devuelve lugares ordenados por distancia', async () => {
    const res = await request(httpServer)
      .get('/v1/sites/nearby')
      .query({ lat: LA_PLATA.lat, lng: LA_PLATA.lng, radiusMeters: 200_000 })
      .expect(200);

    expect(res.body.success).toBe(true);
    const data = res.body.data as Array<{ name: string; distanceMeters: number }>;
    expect(data.length).toBeGreaterThan(0);
    expect(data[0].name).toBe('Laguna La Plata Demo');
    expect(data[0].distanceMeters).toBeLessThan(5_000);
    expect(data[1].distanceMeters).toBeGreaterThan(data[0].distanceMeters);
  });

  it('GET /v1/sites/search tolera acentos (chascomus → chascomús)', async () => {
    const res = await request(httpServer)
      .get('/v1/sites/search')
      .query({ q: 'chasc' })
      .expect(200);

    expect(res.body.success).toBe(true);
  });

  it('GET /v1/sites/search por nombre devuelve resultados', async () => {
    const res = await request(httpServer).get('/v1/sites/search').query({ q: 'Río Demo' }).expect(200);
    const data = res.body.data as Array<{ name: string }>;
    expect(data.length).toBeGreaterThan(0);
    expect(data[0].name).toContain('Río Demo');
  });

  it('GET /v1/sites/autocomplete sugiere por nombre', async () => {
    const res = await request(httpServer).get('/v1/sites/autocomplete').query({ q: 'laguna' }).expect(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('POST /v1/auth/register crea usuario y devuelve tokens', async () => {
    const res = await request(httpServer).post('/v1/auth/register').send({
      email: 'e2e.user@pescaba.dev',
      password: 'SuperSecreto123!',
      username: 'e2e_user',
    }).expect(201);

    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  it('POST /v1/auth/login autentica y permite /v1/auth/me', async () => {
    const login = await request(httpServer)
      .post('/v1/auth/login')
      .send({ email: 'e2e.user@pescaba.dev', password: 'SuperSecreto123!' })
      .expect(200);

    const accessToken = login.body.data.accessToken as string;
    const me = await request(httpServer)
      .get('/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(me.body.data.email).toBe('e2e.user@pescaba.dev');
  });

  it('POST /v1/favorites guarda y GET /v1/favorites lista', async () => {
    const login = await request(httpServer)
      .post('/v1/auth/login')
      .send({ email: 'e2e.user@pescaba.dev', password: 'SuperSecreto123!' });
    const accessToken = login.body.data.accessToken as string;
    const auth = (r: request.Test) => r.set('Authorization', `Bearer ${accessToken}`);

    const sites = await request(httpServer).get('/v1/sites/nearby').query({
      lat: LA_PLATA.lat,
      lng: LA_PLATA.lng,
      radiusMeters: 200_000,
    });
    const siteId = sites.body.data[0].id as string;

    await auth(
      request(httpServer).post(`/v1/favorites/${siteId}`).send({ listName: 'favorites' }),
    ).expect(201);

    const list = await auth(request(httpServer).get('/v1/favorites')).expect(200);
    expect(list.body.data.length).toBeGreaterThan(0);
  });

  it('POST /v1/sites/suggestions crea sugerencia pendiente (público)', async () => {
    const res = await request(httpServer)
      .post('/v1/sites/suggestions')
      .send({
        name: 'Sugerencia e2e',
        siteType: 'lagoon',
        latitude: -35.0,
        longitude: -58.0,
        countryCode: 'ar',
        infoAccurate: true,
      })
      .expect(201);

    expect(res.body.data.status).toBe('pending');
  });

  it('POST /v1/sites/:id/reports crea reporte', async () => {
    const login = await request(httpServer)
      .post('/v1/auth/login')
      .send({ email: 'e2e.user@pescaba.dev', password: 'SuperSecreto123!' });
    const accessToken = login.body.data.accessToken as string;

    const sites = await request(httpServer).get('/v1/sites').expect(200);
    const siteId = sites.body.data[0].id as string;

    const res = await request(httpServer)
      .post(`/v1/sites/${siteId}/reports`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ reportType: 'wrong_coordinates', description: 'Test e2e' })
      .expect(201);

    expect(res.body.data.reportType).toBe('wrong_coordinates');
  });

  it('Protege /v1/admin/sites: 401 sin token, 403 con rol user', async () => {
    await request(httpServer).get('/v1/admin/sites').expect(401);

    const login = await request(httpServer)
      .post('/v1/auth/login')
      .send({ email: 'e2e.user@pescaba.dev', password: 'SuperSecreto123!' });
    const accessToken = login.body.data.accessToken as string;

    await request(httpServer)
      .get('/v1/admin/sites')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);
  });
});
