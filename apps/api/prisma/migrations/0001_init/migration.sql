-- PescaBA — migración inicial
-- PostgreSQL + PostGIS + pg_trgm + unaccent

-- ────────────────────────────────────────────── Extensiones
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Wrapper inmutable de unaccent (el built-in no es inmutable y no se puede indexar).
-- Permite búsquedas con ILIKE tolerantes a acentos.
CREATE OR REPLACE FUNCTION public.f_unaccent(text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $func$
  SELECT public.unaccent('public.unaccent', $1)
$func$;

-- ────────────────────────────────────────────── Enums

CREATE TYPE "UserRole" AS ENUM ('USER', 'MODERATOR', 'EDITOR', 'ADMIN');
CREATE TYPE "SiteType" AS ENUM ('beach', 'lagoon', 'lake', 'river', 'stream', 'pier', 'jetty', 'harbor', 'club', 'boat_launch', 'public_access', 'dam', 'wetland');
CREATE TYPE "AccessType" AS ENUM ('public', 'permit_required', 'paid', 'free', 'car', 'offroad', 'walking', 'boat');
CREATE TYPE "OwnershipType" AS ENUM ('public', 'private', 'club', 'municipal', 'provincial', 'national', 'cooperative', 'unknown');
CREATE TYPE "AmenityType" AS ENUM ('parking', 'restrooms', 'camping', 'grills', 'store', 'boat_ramp', 'boat_rental', 'guides', 'cell_signal');
CREATE TYPE "SpeciesCategory" AS ENUM ('baitfish', 'sport', 'predator', 'commercial');
CREATE TYPE "ReportType" AS ENUM ('wrong_coordinates', 'place_closed', 'restricted_access', 'false_information', 'wrong_phone', 'dangerous_place', 'garbage', 'turbid_water', 'fishing_prohibited', 'duplicate', 'inappropriate_content');
CREATE TYPE "ReportStatus" AS ENUM ('open', 'in_review', 'resolved', 'rejected');
CREATE TYPE "SuggestionStatus" AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE "FavoriteListName" AS ENUM ('favorites', 'pending', 'visited');
CREATE TYPE "PhotoModerationStatus" AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE "AuthProvider" AS ENUM ('local', 'google', 'apple');

-- ────────────────────────────────────────────── users

CREATE TABLE "users" (
  "id" UUID NOT NULL,
  "authProvider" "AuthProvider" NOT NULL DEFAULT 'local',
  "authSubject" TEXT,
  "email" TEXT NOT NULL,
  "username" TEXT,
  "fullName" TEXT,
  "avatarUrl" TEXT,
  "passwordHash" TEXT,
  "role" "UserRole" NOT NULL DEFAULT 'USER',
  "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  "preferredLanguage" TEXT NOT NULL DEFAULT 'es',
  "preferredUnits" TEXT NOT NULL DEFAULT 'metric',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_authSubject_key" ON "users"("authSubject");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_role_idx" ON "users"("role");

-- ────────────────────────────────────────────── species

CREATE TABLE "species" (
  "id" UUID NOT NULL,
  "slug" TEXT NOT NULL,
  "commonNameEs" TEXT NOT NULL,
  "commonNameEn" TEXT,
  "scientificName" TEXT NOT NULL,
  "category" "SpeciesCategory" NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "species_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "species_slug_key" ON "species"("slug");
CREATE INDEX "species_category_idx" ON "species"("category");

-- ────────────────────────────────────────────── regions

CREATE TABLE "regions" (
  "id" UUID NOT NULL,
  "countryCode" TEXT NOT NULL,
  "adminLevel1" TEXT,
  "adminLevel2" TEXT,
  "adminLevel3" TEXT,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "boundaryGeoJson" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "regions_countryCode_slug_key" ON "regions"("countryCode", "slug");
CREATE INDEX "regions_countryCode_idx" ON "regions"("countryCode");

-- ────────────────────────────────────────────── fishing_sites

CREATE TABLE "fishing_sites" (
  "id" UUID NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "alternativeName" TEXT,
  "descriptionShort" TEXT,
  "descriptionLong" TEXT,
  "siteType" "SiteType" NOT NULL,
  "accessType" "AccessType",
  "ownershipType" "OwnershipType",
  "isPublic" BOOLEAN NOT NULL DEFAULT true,
  "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL,
  "geomPrecisionMeters" INTEGER,
  "addressLine" TEXT,
  "addressNotes" TEXT,
  "locality" TEXT,
  "municipality" TEXT,
  "province" TEXT,
  "region" TEXT,
  "countryCode" TEXT NOT NULL DEFAULT 'ar',
  "postalCode" TEXT,
  "phone" TEXT,
  "phoneExtension" TEXT,
  "whatsapp" TEXT,
  "email" TEXT,
  "website" TEXT,
  "openingHours" TEXT,
  "entryFee" TEXT,
  "bestSeason" TEXT,
  "difficultyLevel" INTEGER,
  "allowsBoats" BOOLEAN NOT NULL DEFAULT false,
  "allowsNightFishing" BOOLEAN NOT NULL DEFAULT false,
  "allowsCamping" BOOLEAN NOT NULL DEFAULT false,
  "source" TEXT,
  "externalId" TEXT,
  "createdBy" UUID,
  "updatedBy" UUID,
  "verifiedBy" UUID,
  "verifiedAt" TIMESTAMP(3),
  "lastCheckedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "fishing_sites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "fishing_sites_slug_key" ON "fishing_sites"("slug");
CREATE INDEX "fishing_sites_siteType_idx" ON "fishing_sites"("siteType");
CREATE INDEX "fishing_sites_isVerified_idx" ON "fishing_sites"("isVerified");
CREATE INDEX "fishing_sites_isActive_idx" ON "fishing_sites"("isActive");
CREATE INDEX "fishing_sites_lat_lng_idx" ON "fishing_sites"("latitude", "longitude");
CREATE INDEX "fishing_sites_locality_idx" ON "fishing_sites"("locality");
CREATE INDEX "fishing_sites_province_idx" ON "fishing_sites"("province");
CREATE INDEX "fishing_sites_countryCode_idx" ON "fishing_sites"("countryCode");
CREATE INDEX "fishing_sites_createdAt_idx" ON "fishing_sites"("createdAt");

-- Índice GiST sobre la geografía calculada (EPSG:4326). Permite ST_DWithin/ST_Distance
-- rápidos usando exactamente esta expresión.
-- Nota: se usa CAST(... AS geography) porque el parser de CREATE INDEX no acepta `::` en
-- la expresión; el planner igual lo normaliza y las queries con `::geography` lo aprovechan.
CREATE INDEX "fishing_sites_geom_gist" ON "fishing_sites"
  USING GIST (CAST(ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326) AS geography));

-- Índice pg_trgm para coincidencias difusas por nombre (autocompletado).
CREATE INDEX "fishing_sites_name_trgm" ON "fishing_sites" USING GIN (public.f_unaccent("name") gin_trgm_ops);

-- Índice FTS (full-text search) sobre campos de texto para ranking de búsqueda.
CREATE INDEX "fishing_sites_search_vector_idx" ON "fishing_sites"
  USING GIN ((
    setweight(to_tsvector('spanish', COALESCE("name", '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE("alternativeName", '')), 'B') ||
    setweight(to_tsvector('spanish', COALESCE("locality", '')), 'B') ||
    setweight(to_tsvector('spanish', COALESCE("municipality", '')), 'C') ||
    setweight(to_tsvector('spanish', COALESCE("descriptionShort", '')), 'C')
  ));

ALTER TABLE "fishing_sites"
  ADD CONSTRAINT "fishing_sites_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "fishing_sites"
  ADD CONSTRAINT "fishing_sites_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "fishing_sites"
  ADD CONSTRAINT "fishing_sites_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ────────────────────────────────────────────── fishing_site_species

CREATE TABLE "fishing_site_species" (
  "siteId" UUID NOT NULL,
  "speciesId" UUID NOT NULL,
  "abundance" TEXT,
  "season" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "fishing_site_species_pkey" PRIMARY KEY ("siteId", "speciesId")
);

ALTER TABLE "fishing_site_species"
  ADD CONSTRAINT "fishing_site_species_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "fishing_sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "fishing_site_species"
  ADD CONSTRAINT "fishing_site_species_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "species"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ────────────────────────────────────────────── site_amenities

CREATE TABLE "site_amenities" (
  "siteId" UUID NOT NULL,
  "amenityType" "AmenityType" NOT NULL,
  "isAvailable" BOOLEAN NOT NULL DEFAULT true,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "site_amenities_pkey" PRIMARY KEY ("siteId", "amenityType")
);

ALTER TABLE "site_amenities"
  ADD CONSTRAINT "site_amenities_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "fishing_sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ────────────────────────────────────────────── site_photos

CREATE TABLE "site_photos" (
  "id" UUID NOT NULL,
  "siteId" UUID NOT NULL,
  "userId" UUID,
  "storageKey" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "thumbnailUrl" TEXT,
  "width" INTEGER,
  "height" INTEGER,
  "mimeType" TEXT,
  "caption" TEXT,
  "isCover" BOOLEAN NOT NULL DEFAULT false,
  "moderationStatus" "PhotoModerationStatus" NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "site_photos_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "site_photos_siteId_idx" ON "site_photos"("siteId");
CREATE INDEX "site_photos_moderationStatus_idx" ON "site_photos"("moderationStatus");

ALTER TABLE "site_photos"
  ADD CONSTRAINT "site_photos_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "fishing_sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "site_photos"
  ADD CONSTRAINT "site_photos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ────────────────────────────────────────────── favorites

CREATE TABLE "favorites" (
  "userId" UUID NOT NULL,
  "siteId" UUID NOT NULL,
  "listName" "FavoriteListName" NOT NULL DEFAULT 'favorites',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "favorites_pkey" PRIMARY KEY ("userId", "siteId")
);

CREATE INDEX "favorites_listName_idx" ON "favorites"("listName");

ALTER TABLE "favorites"
  ADD CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "favorites"
  ADD CONSTRAINT "favorites_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "fishing_sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ────────────────────────────────────────────── site_reports

CREATE TABLE "site_reports" (
  "id" UUID NOT NULL,
  "siteId" UUID NOT NULL,
  "userId" UUID,
  "reportType" "ReportType" NOT NULL,
  "description" TEXT,
  "status" "ReportStatus" NOT NULL DEFAULT 'open',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  "resolvedBy" UUID,

  CONSTRAINT "site_reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "site_reports_siteId_idx" ON "site_reports"("siteId");
CREATE INDEX "site_reports_status_idx" ON "site_reports"("status");
CREATE INDEX "site_reports_createdAt_idx" ON "site_reports"("createdAt");

ALTER TABLE "site_reports"
  ADD CONSTRAINT "site_reports_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "fishing_sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "site_reports"
  ADD CONSTRAINT "site_reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ────────────────────────────────────────────── site_suggestions

CREATE TABLE "site_suggestions" (
  "id" UUID NOT NULL,
  "userId" UUID,
  "name" TEXT NOT NULL,
  "siteType" "SiteType" NOT NULL,
  "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL,
  "addressLine" TEXT,
  "locality" TEXT,
  "municipality" TEXT,
  "province" TEXT,
  "countryCode" TEXT NOT NULL DEFAULT 'ar',
  "phone" TEXT,
  "website" TEXT,
  "description" TEXT,
  "accessNotes" TEXT,
  "amenities" TEXT[] NOT NULL,
  "speciesSlugs" TEXT[] NOT NULL,
  "source" TEXT,
  "status" "SuggestionStatus" NOT NULL DEFAULT 'pending',
  "reviewedBy" UUID,
  "reviewedAt" TIMESTAMP(3),
  "rejectionReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "site_suggestions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "site_suggestions_status_idx" ON "site_suggestions"("status");
CREATE INDEX "site_suggestions_createdAt_idx" ON "site_suggestions"("createdAt");

ALTER TABLE "site_suggestions"
  ADD CONSTRAINT "site_suggestions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ────────────────────────────────────────────── fishing_regulations

CREATE TABLE "fishing_regulations" (
  "id" UUID NOT NULL,
  "regionId" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT,
  "content" TEXT,
  "officialUrl" TEXT,
  "effectiveFrom" TIMESTAMP(3),
  "effectiveTo" TIMESTAMP(3),
  "language" TEXT NOT NULL DEFAULT 'es',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "fishing_regulations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "fishing_regulations_regionId_idx" ON "fishing_regulations"("regionId");
CREATE INDEX "fishing_regulations_effectiveFrom_idx" ON "fishing_regulations"("effectiveFrom");

ALTER TABLE "fishing_regulations"
  ADD CONSTRAINT "fishing_regulations_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ────────────────────────────────────────────── audit_logs

CREATE TABLE "audit_logs" (
  "id" UUID NOT NULL,
  "userId" UUID,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "before" JSONB,
  "after" JSONB,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_logs_entity_idx" ON "audit_logs"("entityType", "entityId");
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

ALTER TABLE "audit_logs"
  ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
