import { LoginForm } from "@/components/forms/AuthForms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoginAction } from "@/lib/actions/auth.actions";

export default async function Page() {

    return (
        <LoginForm />
        // <div>
        //     <form >
        //         <input placeholder="username" name="username" />
        //         <input placeholder="password" name="password" />
        //         <button type="submit">
        //             submit
        //         </button>
        //     </form>
        // </div>
    )
}