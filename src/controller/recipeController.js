import {prisma} from "../config/db.js"

const createRecipe = async (req, res) => {
    const {recipeName, description, recipeImg, cookingTime, userID, categoryID} = req.body;

    if (!recipeName) {
            return res.status(400).json({
                status: "error",
                message: "Recipe name is required"
            });
    }


    const recipeExist = await prisma.recipes.findUnique({
        where: {recipeName: recipeName}
    })

    if (recipeExist) {
        return res.status(400).json({status: "error", message: "Recipe already exists"});
    }

    const recipe = await prisma.recipes.create({
        data: {
            recipeName,
            description,
            recipeImg,
            cookingTime,
            
            user:{
                connect:{
                    userID: userID
                }
            },

            category: {
                connect: {
                    categoryID: categoryID
                }
            }
        }
    });

    res.status(201).json({
        status: "success",
        data: {
            recipe
        }
    })
}

const getRecipes = async (req, res) =>{
    const recipes = await prisma.recipes.findMany();

    return res.status(201).json({
        status: "success",
        recipes
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
    
    return res.status(201).json({
        status: "success",
        recipe
    })
}

const updateRecipe = async (req, res) => {
    const {id} = req.params;
    const {recipeName, description, recipeImg, cookingTime, userID, categoryID} = req.body;

    const updateCategory = await prisma.recipes.update({
        where: {recipeID: id},
        data: {
            recipeName, 
            description, 
            recipeImg, 
            cookingTime, 
            userID, 
            categoryID
        }
    })
    
    return res.status(200).json({
        status: "success",
        message: "Category updated successfully",
        updateCategory,
    });
}

const deleteRecipe = async (req, res) => { 
    try { 
        const { id } = req.params; 
        // Check recipe tồn tại 
        const recipeExist = await prisma.recipes.findUnique({ 
            where: { recipeID: id } }); 
        if (!recipeExist) { 
            return res.status(404).json({ 
                status: "error", 
                message: "Recipe not found"
            }); 
        } 
        
        // Delete recipe 
        await prisma.recipes.delete({ 
            where: { recipeID: id } 
        });
        
        return res.status(200).json({ 
            status: "success", 
            message: "Recipe deleted successfully" 
        }); 
    } catch (error) { 
        console.error(error); 
        return res.status(500).json({ 
            status: "error", 
            message: "Internal server error" }); 
    }
}


export {getRecipes, createRecipe, getRecipeByName,updateRecipe, deleteRecipe};