import { LoginAction } from "@/lib/actions/auth.actions";

export default async function Page() {

    return (
        <div>
            <form action={LoginAction}>
                <input placeholder="username" name="username" />
                <input placeholder="password" name="password" />
                <button type="submit">
                    submit
                </button>
            </form>
        </div>
    )
}