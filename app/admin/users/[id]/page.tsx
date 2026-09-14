import { ADMIN_GetSingleUserAction } from "@/lib/actions/admin.users.actions"

export default async function SingleUserPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const user = await ADMIN_GetSingleUserAction(id)

    if (!user) throw Error("no user found")

    return <div className="p-2">
        <section className="border-2 border-white/20 border-dashed rounded-lg p-3">
            {/* info */}
            <div className="space-y-1">
                <div>
                    <span>نام کاربری : </span>
                    <span className="underline">{user.username}</span>
                </div>

                <div>
                    <span>شماره : </span>
                    <span className="underline">{user.number}</span>
                </div>

                <div>
                    <span>ادمین : </span>
                    <span className={`underline ${user.admin ? 'text-emerald-500 font-semibold' : ''}`}>{user.admin ? 'هست' : 'نیست'}</span>
                </div>

                <div>
                    <span>آدرس : </span>

                    {
                        user.address
                            ?
                            <span className="text-wrap">
                                {user.address}
                            </span>
                            :
                            <span className="underline">
                                آدرس ندارد
                            </span>
                    }
                </div>
            </div>
        </section>
    </div>
}