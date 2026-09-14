"use server"

import { ActionError } from "../action-error"
import prisma from "../db"

export async function ADMIN_GetUsersActions(){
    try{
        const data = await prisma.user.findMany({
            omit:{
                password:true,
                updatedAt:true
            },
            orderBy:{
                createdAt:'desc'
            }
        })

        return data
    }catch(err){
        if(err instanceof Error){
            throw new ActionError({
                error:err.message
            })
        }

        throw new ActionError({
            error:"unknown error"
        })
    }
}

export async function ADMIN_GetSingleUserAction(id:string){
    try{
        const data = await prisma.user.findUnique({
            where:{
                id
            },
            omit:{
                password:true,
                updatedAt:true
            }
        })

        return data
    }catch(err){
        if(err instanceof Error){
            throw new ActionError({
                error:err.message
            })
        }

        throw new ActionError({
            error:"unknown error"
        })
    }
}
