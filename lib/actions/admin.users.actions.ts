"use server"

import prisma from "../db"

export async function ADMIN_GetUsersActions(){
    try{
        const data = await prisma.user.findMany({
            select:{
                id:true,
                username:true,
                number:true,
                createdAt:true,
                admin:true
            }
        })

        return data
    }catch(err){
        throw err
    }
}