"use server"

import { ActionError } from "../action-error"
import { auth } from "../Auth"
import prisma from "../db"

export async function ADMIN_GetOrdersAction(){
    try{
        const session = await auth()

        if(!session){
            throw Error("you are not logged in")
        }

        const loggedInUser = await prisma.user.findUnique({
            where:{
                id:session.user.id
            },
            select:{
                admin:true
            }
        })

        if(!loggedInUser || !loggedInUser.admin){
            throw Error("you dont have permission")
        }

        const data = await prisma.orderBatch.findMany({
            include:{
                orderItems:{
                    select:{
                        _count:true
                    }
                },
                user:{
                    select:{
                        id:true,
                        username:true
                    }
                }
            }
        })

        return {success:true,data}
    }catch(err){
        if(err instanceof Error){
            throw new ActionError({
                error:err.message
            })
        }
        throw new ActionError({
            error:"get orders admin:unknown error"
        })
    }
}