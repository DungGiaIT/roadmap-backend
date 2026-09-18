import {prisma} from "../config/db.js"

const createRecipe = async (req, res) => {
    const {recipeName, description, recipeImg, cookingTime, categoryID} = req.body;

    if (!recipeName) {
            return res.status(400).json({
                status: "error",
                message: "Recipe name is required"
            });
    }


    const recipe = await prisma.recipes.create({
        data: {
            recipeName,
            description,
            recipeImg,
            cookingTime,
            
            user:{
                connect:{
                    userID: req.user.userID
                }
            },

            category: {
                connect: {
                    categoryID: categoryID
                }
            }
        }
    });

    return res.status(201).json({
        status: "success",
        data: {
            recipe
        }
    })
}

const getRecipes = async (req, res) =>{
    const recipes = await prisma.recipes.findMany();

    return res.status(200).json({
        status: "success",
        data: { recipes }
    })
}

const getRecipeByName = async (req, res) =>{
    const {recipeName} = req.params;

    const recipe = await prisma.recipes.findUnique({
        where: {recipeName: recipeName}
    })

    if (!recipe) {
        return res.status(404).json({
            status: "error",
            message: "Recipe not found"
        });
    }
    
    return res.status(200).json({
        status: "success",
        data: { recipe }
    })
}

const updateRecipe = async (req, res) => {
    const {id} = req.params;
    const {recipeName, description, recipeImg, cookingTime, categoryID} = req.body;

    const updatedRecipe = await prisma.recipes.update({
        where: {recipeID: id},
        data: {
            recipeName, 
            description, 
            recipeImg, 
            cookingTime, 
            categoryID
        }
    })
    
    return res.status(200).json({
        status: "success",
        data: { recipe: updatedRecipe },
    });
}

const deleteRecipe = async (req, res) => {
    const { id } = req.params;
    await prisma.recipes.delete({ where: { recipeID: id } });

    return res.status(200).json({
        status: "success",
        data: { message: "Recipe deleted successfully" },
    });
};


export {getRecipes, createRecipe, getRecipeByName,updateRecipe, deleteRecipe};
