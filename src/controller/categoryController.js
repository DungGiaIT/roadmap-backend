import { prisma } from "../config/db.js";

const createCategory = async (req, res) => {
    const {categoryName} = req.body;

    if (!categoryName){
        return res.status(400).json({
            status: "error",
            message: "Category name is required",
        })
    }

    const categoryExist = await prisma.category.findUnique({
        where: {categoryName: categoryName},
    })

    if (categoryExist){
        return res.status(400).json("Category already")
    }
    
    const newCategory = await prisma.category.create({
        data: {
            categoryName: categoryName,
        }
    })
    
    return res.status(201).json({
        message:  "Category created successfully",
        newCategory,
    });
}

const getCategories = async(req,res) =>{
    const categories = await prisma.category.findMany();
    
    return res.status(200).json({
        status: "success",
        categories
    })
}

const getCategoryById = async (req, res) =>{
    const {id} = req.params;
    const category = await prisma.category.findUnique({
        where: {
            categoryID: id
        }
    });

    if (!category) {
        return res.status(404).json({
            status: "error",
            message: "Category not found"
        });
    };

    return res.status(200).json({
        status: "success",
        category
    });
}

const updateCategory = async (req, res)=>{
    const {id} = req.params;
    const {categoryName} = req.body;

    const updateCategory = await prisma.category.update({
        where: {
            categoryID: id
        },
        data: {
            categoryName
        }
    });

    return res.status(200).json({
        status: "success",
        message: "Category updated successfully",
        updateCategory
    });
}

const deleteCategory = async (req, res)=>{
    const {id} = req.params;
    
    const categoryExist = await prisma.category.findUnique({
        where: {
            categoryID:id
        }
    })

    if (!categoryExist) {
        return res.status(404).json({
            status: "error",
            message: "Category not found"
        });
    }

    await prisma.category.delete({
        where: {
            categoryID: id
        }
    });

    return res.status(200).json({
        status: "success",
        message: "Category deleted successfully"
    });
}

export{createCategory, getCategories, getCategoryById, updateCategory, deleteCategory};