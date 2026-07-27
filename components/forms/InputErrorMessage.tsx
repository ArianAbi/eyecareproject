"use client"

import { HTMLAttributes } from "react"

export default function InputErrorMesage({message,condition}:{message?:string,condition?:boolean}){
    if(condition !== undefined && condition){
        return <div className="text-red-500 mt-2">
            {message ? message : ""}
        </div>
    }
}