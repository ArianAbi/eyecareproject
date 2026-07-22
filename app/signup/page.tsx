"use client"

import { CreateUserAction } from "@/lib/actions/auth.actions"
import { useState } from "react"

export default function Signup() {

    const [username, setUsername] = useState("")
    const [number, setNumber] = useState("")
    const [password, setPassword] = useState("")

    async function CreateUser() {
        const result = await CreateUserAction({
            username,
            number,
            password
        })

        console.log(result);
        alert(result)
    }

    return (
        <div>
            <h1>SignUp</h1>

            <div>
                <input type="text" placeholder="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <input type="text" placeholder="phone"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                />
                <input type="text" placeholder="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button onClick={CreateUser}>
                    Submit
                </button>
            </div>
        </div>
    )
}