-- CreateTable
CREATE TABLE "Recipes" (
    "recipeID" TEXT NOT NULL,
    "recipeName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "recipeImg" TEXT,
    "cookingTime" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userID" TEXT NOT NULL,
    "categoryID" TEXT NOT NULL,

    CONSTRAINT "Recipes_pkey" PRIMARY KEY ("recipeID")
);

-- CreateTable
CREATE TABLE "Category" (
    "categoryID" TEXT NOT NULL,
    "categoryName" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("categoryID")
);

-- CreateTable
CREATE TABLE "Ingredient" (
    "ingredientID" TEXT NOT NULL,
    "IngredientName" TEXT NOT NULL,

    CONSTRAINT "Ingredient_pkey" PRIMARY KEY ("ingredientID")
);

-- CreateTable
CREATE TABLE "RecipeIngredient" (
    "recipeID" TEXT NOT NULL,
    "ingredientID" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "RecipeIngredient_pkey" PRIMARY KEY ("recipeID","ingredientID")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_categoryName_key" ON "Category"("categoryName");

-- AddForeignKey
ALTER TABLE "Recipes" ADD CONSTRAINT "Recipes_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipes" ADD CONSTRAINT "Recipes_categoryID_fkey" FOREIGN KEY ("categoryID") REFERENCES "Category"("categoryID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_recipeID_fkey" FOREIGN KEY ("recipeID") REFERENCES "Recipes"("recipeID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_ingredientID_fkey" FOREIGN KEY ("ingredientID") REFERENCES "Ingredient"("ingredientID") ON DELETE RESTRICT ON UPDATE CASCADE;
