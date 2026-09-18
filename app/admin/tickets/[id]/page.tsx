import { TicketDetail } from "@/components/core/TicketPages"
export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
    return <TicketDetail admin={true} id={(await params).id} />
}
