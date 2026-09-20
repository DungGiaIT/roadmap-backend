-- DropForeignKey
ALTER TABLE "RecipeIngredient" DROP CONSTRAINT "RecipeIngredient_ingredientID_fkey";

-- DropForeignKey
ALTER TABLE "RecipeIngredient" DROP CONSTRAINT "RecipeIngredient_recipeID_fkey";

-- CreateIndex
CREATE UNIQUE INDEX "Ingredient_IngredientName_key" ON "Ingredient"("IngredientName");

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_recipeID_fkey" FOREIGN KEY ("recipeID") REFERENCES "Recipes"("recipeID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_ingredientID_fkey" FOREIGN KEY ("ingredientID") REFERENCES "Ingredient"("ingredientID") ON DELETE CASCADE ON UPDATE CASCADE;
