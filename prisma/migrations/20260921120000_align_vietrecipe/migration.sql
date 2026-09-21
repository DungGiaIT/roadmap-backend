-- Align the original course schema with the VietRecipe portfolio contract.

CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');
CREATE TYPE "Role" AS ENUM ('USER', 'EDITOR', 'ADMIN');
CREATE TYPE "Theme" AS ENUM ('LIGHT', 'DARK', 'SYSTEM');
CREATE TYPE "RecipeStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED');
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');
CREATE TYPE "IngredientRole" AS ENUM ('MAIN', 'SECONDARY', 'SEASONING');
CREATE TYPE "IngredientKind" AS ENUM ('MAIN', 'SECONDARY', 'SEASONING');
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK');
CREATE TYPE "CommentStatus" AS ENUM ('VISIBLE', 'HIDDEN', 'DELETED');
CREATE TYPE "ModerationAction" AS ENUM ('SUBMIT', 'APPROVE', 'REJECT', 'ARCHIVE');

ALTER TABLE "User" ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';

CREATE TABLE "UserRole" (
    "userID" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userID", "role"),
    CONSTRAINT "UserRole_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userID" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "RefreshToken_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "RefreshToken_userID_revokedAt_idx" ON "RefreshToken"("userID", "revokedAt");

CREATE TABLE "UserPreference" (
    "userID" TEXT NOT NULL,
    "theme" "Theme" NOT NULL DEFAULT 'SYSTEM',
    "locale" TEXT NOT NULL DEFAULT 'vi',
    "dietTags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "preferredTimeMax" INTEGER,
    "difficulty" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "mainIngredientIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("userID"),
    CONSTRAINT "UserPreference_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE CASCADE ON UPDATE CASCADE
);

ALTER TABLE "Recipes"
    ADD COLUMN "slug" TEXT,
    ADD COLUMN "prepMinutes" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "servings" INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN "difficulty" "Difficulty" NOT NULL DEFAULT 'EASY',
    ADD COLUMN "status" "RecipeStatus" NOT NULL DEFAULT 'DRAFT',
    ADD COLUMN "rejectionReason" TEXT,
    ADD COLUMN "publishedAt" TIMESTAMP(3);

UPDATE "Recipes"
SET "slug" = lower(regexp_replace(regexp_replace("recipeName", '[^a-zA-Z0-9]+', '-', 'g'), '(^-+|-+$)', '', 'g')) || '-' || substr("recipeID", 1, 8)
WHERE "slug" IS NULL;

ALTER TABLE "Recipes" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Recipes_slug_key" ON "Recipes"("slug");
CREATE INDEX "Recipes_status_publishedAt_idx" ON "Recipes"("status", "publishedAt");
CREATE INDEX "Recipes_userID_status_idx" ON "Recipes"("userID", "status");
UPDATE "Recipes" SET "status" = 'PUBLISHED', "publishedAt" = COALESCE("publishedAt", "createdAt");

ALTER TABLE "Ingredient"
    ADD COLUMN "nameEn" TEXT,
    ADD COLUMN "slug" TEXT,
    ADD COLUMN "kind" "IngredientKind" NOT NULL DEFAULT 'MAIN';

UPDATE "Ingredient"
SET "slug" = lower(regexp_replace(regexp_replace("IngredientName", '[^a-zA-Z0-9]+', '-', 'g'), '(^-+|-+$)', '', 'g')) || '-' || substr("ingredientID", 1, 8)
WHERE "slug" IS NULL;

ALTER TABLE "Ingredient" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Ingredient_slug_key" ON "Ingredient"("slug");

ALTER TABLE "RecipeIngredient"
    ADD COLUMN "unit" TEXT,
    ADD COLUMN "note" TEXT,
    ADD COLUMN "role" "IngredientRole" NOT NULL DEFAULT 'SECONDARY',
    ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
UPDATE "RecipeIngredient" SET "role" = 'MAIN';
CREATE INDEX "RecipeIngredient_ingredientID_role_recipeID_idx" ON "RecipeIngredient"("ingredientID", "role", "recipeID");

CREATE TABLE "RecipeStep" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "instruction" TEXT NOT NULL,
    "imageUrl" TEXT,
    "timerSeconds" INTEGER,
    CONSTRAINT "RecipeStep_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "RecipeStep_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipes"("recipeID") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "RecipeStep_recipeId_stepNumber_key" ON "RecipeStep"("recipeId", "stepNumber");

CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameVi" TEXT NOT NULL,
    "nameEn" TEXT,
    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

CREATE TABLE "RecipeTag" (
    "recipeId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    CONSTRAINT "RecipeTag_pkey" PRIMARY KEY ("recipeId", "tagId"),
    CONSTRAINT "RecipeTag_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipes"("recipeID") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RecipeTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "userID" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Collection_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Collection_userID_name_key" ON "Collection"("userID", "name");

CREATE TABLE "CollectionRecipe" (
    "collectionID" TEXT NOT NULL,
    "recipeID" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    CONSTRAINT "CollectionRecipe_pkey" PRIMARY KEY ("collectionID", "recipeID"),
    CONSTRAINT "CollectionRecipe_collectionID_fkey" FOREIGN KEY ("collectionID") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CollectionRecipe_recipeID_fkey" FOREIGN KEY ("recipeID") REFERENCES "Recipes"("recipeID") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "MealPlan" (
    "id" TEXT NOT NULL,
    "userID" TEXT NOT NULL,
    "weekStart" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MealPlan_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "MealPlan_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "MealPlan_userID_weekStart_key" ON "MealPlan"("userID", "weekStart");

CREATE TABLE "MealPlanItem" (
    "id" TEXT NOT NULL,
    "mealPlanID" TEXT NOT NULL,
    "recipeID" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "mealType" "MealType" NOT NULL,
    "note" TEXT,
    CONSTRAINT "MealPlanItem_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "MealPlanItem_mealPlanID_fkey" FOREIGN KEY ("mealPlanID") REFERENCES "MealPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MealPlanItem_recipeID_fkey" FOREIGN KEY ("recipeID") REFERENCES "Recipes"("recipeID") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "MealPlanItem_mealPlanID_date_idx" ON "MealPlanItem"("mealPlanID", "date");

CREATE TABLE "CookingLog" (
    "id" TEXT NOT NULL,
    "userID" TEXT NOT NULL,
    "recipeID" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "servingsUsed" INTEGER,
    "note" TEXT,
    "personalRating" INTEGER,
    CONSTRAINT "CookingLog_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CookingLog_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CookingLog_recipeID_fkey" FOREIGN KEY ("recipeID") REFERENCES "Recipes"("recipeID") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "CookingLog_userID_completedAt_idx" ON "CookingLog"("userID", "completedAt");

CREATE TABLE "CookingPhoto" (
    "id" TEXT NOT NULL,
    "cookingLogID" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "publicUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CookingPhoto_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CookingPhoto_cookingLogID_fkey" FOREIGN KEY ("cookingLogID") REFERENCES "CookingLog"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Rating" (
    "id" TEXT NOT NULL,
    "userID" TEXT NOT NULL,
    "recipeID" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "review" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Rating_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Rating_recipeID_fkey" FOREIGN KEY ("recipeID") REFERENCES "Recipes"("recipeID") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Rating_userID_recipeID_key" ON "Rating"("userID", "recipeID");

CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "userID" TEXT NOT NULL,
    "recipeID" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "CommentStatus" NOT NULL DEFAULT 'VISIBLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Comment_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_recipeID_fkey" FOREIGN KEY ("recipeID") REFERENCES "Recipes"("recipeID") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Comment_recipeID_status_createdAt_idx" ON "Comment"("recipeID", "status", "createdAt");

CREATE TABLE "ModerationEvent" (
    "id" TEXT NOT NULL,
    "recipeID" TEXT NOT NULL,
    "reviewerID" TEXT,
    "action" "ModerationAction" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ModerationEvent_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ModerationEvent_recipeID_fkey" FOREIGN KEY ("recipeID") REFERENCES "Recipes"("recipeID") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ModerationEvent_reviewerID_fkey" FOREIGN KEY ("reviewerID") REFERENCES "User"("userID") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "ModerationEvent_recipeID_createdAt_idx" ON "ModerationEvent"("recipeID", "createdAt");

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorID" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AuditLog_actorID_fkey" FOREIGN KEY ("actorID") REFERENCES "User"("userID") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX "AuditLog_actorID_createdAt_idx" ON "AuditLog"("actorID", "createdAt");
