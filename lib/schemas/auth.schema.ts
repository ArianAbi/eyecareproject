import * as z from "zod"

export const LoginSchema = z.object({
    username:z.string().min(4,{error:"نام کاربری باید حداقل 4 حرف باشد"}).max(15,{error:"نام کاربری نمیتواند بیشتر از 15 حرف باشد"}),
    password:z.string().min(8,{error:"کلمه عبور باید حداقل 8 حرف باشد"}).max(30,{error:"کلمه عبور نمیتواند بیشتر از 30 حرف باشد"})
})

export type LoginSchemaType = z.infer<typeof LoginSchema>

export const SignupSchema = z.object({
    username:z.string().min(4,{error:"نام کاربری باید حداقل 4 حرف باشد"}).max(15,{error:"نام کاربری نمیتواند بیشتر از 15 حرف باشد"}),
    number:z.string().min(11,{error:"فرمت شماره صحیح نیست"}).max(11,{error:"فرمت شماره صحیح نیست"}),
    password:z.string().min(8,{error:"کلمه عبور باید حداقل 8 حرف باشد"}).max(30,{error:"کلمه عبور نمیتواند بیشتر از 30 حرف باشد"}),
    confirmPassword:z.string().min(1,{error:"تکرار پسوورد اجباریست"})
},).refine((data)=>data.password === data.confirmPassword,{
    error:"کلمه عبور مشابه نیست",
    path:["confirmPassword"]
})

export type SignupSchemaType = z.infer<typeof SignupSchema>