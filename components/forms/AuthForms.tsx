"use client"

import { LoginAction, LoginSchema,LoginSchemaType } from "@/lib/actions/auth.actions"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { useActionState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import InputErrorMesage from "./InputErrorMessage"

export function LoginForm() {
    const initialState = {
        error: "",
    }
    const [state, formAction, pending] = useActionState(LoginAction, initialState)

    const {
        register,
        handleSubmit,
        formState
    } = useForm<LoginSchemaType>({
        resolver: zodResolver(LoginSchema)
    })

    const onSubmit = handleSubmit((data) => {
        const formData = new FormData()
        formData.append("username", data.username)
        formData.append("password", data.password)
        formAction(formData)
    })

    return <>
        <Card>
            <CardHeader>
                <CardTitle>
                    ورود به حساب
                </CardTitle>
            </CardHeader>
            <form onSubmit={onSubmit}>
                <CardContent>
                    <div>

                        <Input
                            disabled={pending}
                            placeholder="نام کاربری یا شماره"
                            {...register("username")}
                        />
                        <InputErrorMesage
                            condition={!!formState.errors.username}
                            message={formState.errors.username?.message}
                        />
                    </div>

                    {/* password */}
                    <div>
                        <Input
                            disabled={pending}
                            placeholder="کلمه عبور"
                            {...register("password")}
                        />
                        <InputErrorMesage
                            condition={!!formState.errors.password}
                            message={formState.errors.password?.message}
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button disabled={pending} className={"w-full"} type="submit">
                        ورود
                    </Button>
                </CardFooter>
            </form>
        </Card>
    </>
} 