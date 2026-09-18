import { TicketList } from "@/components/core/TicketPages"
export default async function TicketsPage({ searchParams }: { searchParams: Promise<{ page?: string, status?: string }> }) {
    return <TicketList admin={false} filters={await searchParams} />
}
