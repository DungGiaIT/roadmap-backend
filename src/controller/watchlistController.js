import { prisma } from "../config/db.js";

const getWatchlist = async (req, res) => {
    const watchlist = await prisma.watchlist.findMany({
        where: { userID: req.user.userID },
        include: { recipe: { include: { category: true } } },
        orderBy: { createdAt: "desc" },
    });

    return res.json({ status: "success", data: { watchlist } });
};

const addToWatchlist = async (req, res) => {
    const watchlist = await prisma.watchlist.create({
        data: {
            userID: req.user.userID,
            recipeID: req.params.recipeID,
        },
        include: { recipe: true },
    });

    return res.status(201).json({ status: "success", data: { watchlist } });
};

const removeFromWatchlist = async (req, res) => {
    await prisma.watchlist.delete({
        where: {
            userID_recipeID: {
                userID: req.user.userID,
                recipeID: req.params.recipeID,
            },
        },
    });

    return res.json({
        status: "success",
        data: { message: "Recipe removed from watchlist" },
    });
};

export { getWatchlist, addToWatchlist, removeFromWatchlist };
