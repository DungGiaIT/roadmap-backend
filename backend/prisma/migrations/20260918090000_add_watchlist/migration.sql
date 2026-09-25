-- CreateTable
CREATE TABLE "Watchlist" (
    "watchlistID" TEXT NOT NULL,
    "userID" TEXT NOT NULL,
    "recipeID" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Watchlist_pkey" PRIMARY KEY ("watchlistID")
);

-- CreateIndex
CREATE UNIQUE INDEX "Watchlist_userID_recipeID_key" ON "Watchlist"("userID", "recipeID");

-- CreateIndex
CREATE INDEX "Watchlist_userID_idx" ON "Watchlist"("userID");

-- CreateIndex
CREATE INDEX "Watchlist_recipeID_idx" ON "Watchlist"("recipeID");

-- AddForeignKey
ALTER TABLE "Watchlist" ADD CONSTRAINT "Watchlist_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Watchlist" ADD CONSTRAINT "Watchlist_recipeID_fkey" FOREIGN KEY ("recipeID") REFERENCES "Recipes"("recipeID") ON DELETE CASCADE ON UPDATE CASCADE;
