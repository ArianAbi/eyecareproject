"use client"

import { CreateUserAction, LoginAction } from "@/lib/actions/auth.actions"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { LoginSchema, LoginSchemaType, SignupSchema, SignupSchemaType } from "@/lib/schemas/auth.schema"
import { FieldGroup } from "../ui/field"
import { FormFieldShorthand } from "../core/FormFieldShorthand"
import { Separator } from "../ui/separator"
import { TermsAndConditions } from "../core/TermsAndConditions"
import { toast } from "../ui/toast"
import { Spinner } from "../ui/spinner"

export function LoginForm() {
    const {
        handleSubmit,
        formState,
        control
    } = useForm<LoginSchemaType>({
        resolver: zodResolver(LoginSchema),
        reValidateMode: "onChange",
        mode: "onChange",
        defaultValues: {
            username: "",
            password: ""
        }
    })

    const onSubmit = handleSubmit(async (data) => {
        const response = await LoginAction(data.username, data.password)

        if (response?.error) {
            toast.add({
                title: response.error,
                type: "error"
            })

            return
        }

        toast.add({
            title: "خوش آمدید",
            type: "success"
        })
    })

    return <>
        <Card>
            <CardHeader>
                <CardTitle>
                    ورود به حساب
                </CardTitle>
            </CardHeader>
            <form onSubmit={onSubmit} className="min-w-96">
                <CardContent className="space-y-3">
                    <FieldGroup>
                        <FormFieldShorthand
                            control={control}
                            label="نام کاربری یا شماره"
                            placeholder="نام کاربری یا شماره"
                            name="username"
                            type="text"
                        />

                        <FormFieldShorthand
                            control={control}
                            label="رمز عبور"
                            placeholder="رمز عبور"
                            name="password"
                            type="password"
                        />
                    </FieldGroup>
                </CardContent>
                <CardFooter>
                    <Button disabled={formState.isSubmitting || !formState.isValid} className={"w-full mt-5"} type="submit">
                        <span>
                            ورود
                        </span>
                        {formState.isSubmitting && <Spinner />}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    </>
}


export function SignupForm() {
    const {
        handleSubmit,
        formState,
        control,
        setError
    } = useForm<SignupSchemaType>({
        resolver: zodResolver(SignupSchema),
        mode: "onChange",
        reValidateMode: "onChange",
        defaultValues: {
            username: "",
            number: "",
            password: "",
            confirmPassword: ""
        }
    })

    const onSubmit = handleSubmit(async (data) => {
        let response: Awaited<ReturnType<typeof CreateUserAction>>

        try {
            response = await CreateUserAction(data.username, data.number, data.password)
        } catch (err) {
            toast.add({
                type: "error",
                title: "مشکلی در ایجاد حساب پیش آمده. دوباره تلاش کنید یا با پشتیبانی تماس بگیرید",
                ...(err instanceof Error ? {} : {})
            })
            return
        }

        if (!response.success) {
            // show the message under the offending field(s)
            for (const [field, message] of Object.entries(response.fieldErrors ?? {})) {
                setError(field as keyof SignupSchemaType, { type: "server", message })
            }

            toast.add({
                title: response.error,
                type: "error"
            })
            return
        }

        toast.add({
            title: "حساب ساخته شد",
            type: "success"
        })

        // outside the try/catch so its redirect isn't caught as an error
        await LoginAction(data.username, data.password)
    })


    return <>
        <Card>
            <CardHeader>
                <CardTitle className="text-center font-semibold">
                    ساخت حساب
                </CardTitle>

            </CardHeader>
            <Separator />
            <form onSubmit={onSubmit} className="min-w-96">
                <CardContent>
                    <FieldGroup className="gap-2">
                        <FormFieldShorthand
                            control={control}
                            label="نام کاربری"
                            placeholder="نام کاربری"
                            name="username"
                            type="text"
                        />

                        {/* number */}
                        <FormFieldShorthand
                            control={control}
                            label="شماره"
                            placeholder="0912xxxxxxx"
                            name="number"
                            type="text"
                        />

                        {/* password */}
                        <FormFieldShorthand
                            control={control}
                            label="رمز عبور"
                            placeholder="رمز عبور"
                            name="password"
                            type="password"
                        />

                        {/* number */}
                        <FormFieldShorthand
                            control={control}
                            label="تکرار رمز عبور"
                            placeholder="تکرار رمز عبور"
                            name="confirmPassword"
                            type="password"
                        />
                    </FieldGroup>
                </CardContent>
                <CardFooter>
                    <Button disabled={formState.isSubmitting || !formState.isValid} className={"w-full mt-5"} type="submit">
                        <span>
                            ساخت حساب
                        </span>
                        {formState.isSubmitting && <Spinner />}
                    </Button>
                </CardFooter>
                <Separator className={"mt-2"} />
                <div className="px-2 text-xs">
                    <span>
                        افتتاح حساب به منزله پذیرش
                    </span>
                    <TermsAndConditions />
                    <span>
                        میباشد
                    </span>
                </div>
            </form>
        </Card>
    </>
}

// export function SignupFormCopy() {
//     const initialState = {
//         error: "",
//     }
//     const [state, formAction, pending] = useActionState(CreateUserAction, initialState)

//     const {
//         register,
//         handleSubmit,
//         formState,
//         control
//     } = useForm<SignupSchemaType>({
//         resolver: zodResolver(SignupSchema),
//         mode: "onChange",
//         reValidateMode: "onChange"
//     })

//     const onSubmit = handleSubmit((data) => {
//         const formData = new FormData()
//         formData.append("username", data.username)
//         formData.append("number", data.number)
//         formData.append("password", data.password)
//         formAction(formData)
//     })

//     return <>
//         <Card>
//             <CardHeader>
//                 <CardTitle>
//                     ساخت حساب
//                 </CardTitle>
//             </CardHeader>
//             <form onSubmit={onSubmit} className="min-w-96">
//                 <CardContent className="space-y-3">
//                     {/* username */}
//                     <div>
//                         <Input
//                             disabled={pending}
//                             placeholder="نام کاربری"
//                             {...register("username")}
//                         />
//                         <InputErrorMesage
//                             condition={!!formState.errors.username}
//                             message={formState.errors.username?.message}
//                         />
//                     </div>

//                     {/* number */}
//                     <div>
//                         <Input
//                             disabled={pending}
//                             placeholder="شماره تماس"
//                             {...register("number")}
//                         />
//                         <InputErrorMesage
//                             condition={!!formState.errors.number}
//                             message={formState.errors.number?.message}
//                         />
//                     </div>

//                     {/* password */}
//                     <div>
//                         <Input
//                             disabled={pending}
//                             placeholder="کلمه عبور"
//                             {...register("password")}
//                         />
//                         <InputErrorMesage
//                             condition={!!formState.errors.password}
//                             message={formState.errors.password?.message}
//                         />
//                     </div>

//                     {/* password */}
//                     <div>
//                         <Input
//                             disabled={pending}
//                             placeholder="تکرار کلمه عبور"
//                             {...register("confirmPassword")}
//                         />
//                         <InputErrorMesage
//                             condition={!!formState.errors.confirmPassword}
//                             message={formState.errors.confirmPassword?.message}
//                         />
//                     </div>
//                 </CardContent>
//                 <CardFooter>
//                     <Button disabled={pending || !formState.isValid} className={"w-full mt-5"} type="submit">
//                         ورود
//                     </Button>
//                 </CardFooter>
//             </form>
//         </Card>
//     </>
// }

