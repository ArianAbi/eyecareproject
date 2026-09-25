import { TicketDetail } from "@/components/core/TicketPages"
export default async function TicketPage({ params, searchParams }: { searchParams: Promise<{ messagesPage?: string }>, params: Promise<{ id: string }> }) {
    return <TicketDetail admin={false} id={(await params).id} page={(await searchParams).messagesPage} />
}
