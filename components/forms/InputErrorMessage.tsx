"use client"

export default function InputErrorMesage({message,condition}:{message?:string,condition?:boolean}){
    if(condition !== undefined && condition){
        return <span className="text-red-500">
            {message ? message : ""}
        </span>
    }
}