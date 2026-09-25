/*
  Warnings:

  - A unique constraint covering the columns `[recipeName]` on the table `Recipes` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Recipes_recipeName_key" ON "Recipes"("recipeName");
