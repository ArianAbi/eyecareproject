import { TicketDetail } from "@/components/core/TicketPages"
export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
    return <TicketDetail admin={false} id={(await params).id} />
}
