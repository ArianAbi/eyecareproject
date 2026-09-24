"use server";

import prisma from "../db";
import { requireUser, requireAdmin } from "../access";
import { writeAudit } from "../audit";
import { PaginationObjectDB } from "../pagination-object";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { bale_hashtags } from "../bale-hashtags";
import { emojis } from "../emojis";
import { BALE_SendMessage } from "./bale.actions";

const messageSchema = z
  .string()
  .trim()
  .min(1, "متن پیام را وارد کنید")
  .max(5000);
const ticketSchema = z.object({
  subject: z.string().trim().min(3).max(150),
  message: messageSchema,
});
type Filters = { page?: string | number; status?: string };

function refreshTickets(id?: string) {
  revalidatePath("/tickets", "layout");
  revalidatePath("/admin/tickets", "layout");
  revalidatePath("/admin/summary");
  if (id) {
    revalidatePath(`/tickets/${id}`);
    revalidatePath(`/admin/tickets/${id}`);
  }
}

async function listTickets(filters: Filters, userId?: string) {
  const status: "OPEN" | "CLOSED" | undefined =
    filters.status === "OPEN" || filters.status === "CLOSED"
      ? filters.status
      : undefined;
  const where = { userId, status };
  return prisma.$transaction(async (tx) => ({
    tickets: await tx.ticket.findMany({
      where,
      ...PaginationObjectDB(filters.page),
      orderBy: { updatedAt: "desc" },
      include: {
        user: { select: { username: true } },
        _count: { select: { messages: true } },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: { fromAdmin: true },
        },
      },
    }),
    total: await tx.ticket.count({ where }),
  }));
}

export async function GetTicketsAction(filters: Filters = {}) {
  const user = await requireUser();
  return { success: true, data: await listTickets(filters, user.id) };
}

export async function ADMIN_GetTicketsAction(filters: Filters = {}) {
  await requireAdmin();
  return { success: true, data: await listTickets(filters) };
}

export async function GetSingleTicketAction(id: string) {
  const user = await requireUser();
  return prisma.ticket.findFirst({
    where: { id, userId: user.id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { username: true } } },
      },
    },
  });
}

export async function ADMIN_GetSingleTicketAction(id: string) {
  await requireAdmin();
  return prisma.ticket.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { username: true } } },
      },
    },
  });
}

export async function CreateTicketAction(input: {
  subject: string;
  message: string;
}) {
  const user = await requireUser();
  const value = ticketSchema.parse(input);
  const data = await prisma.$transaction(async (tx) => {
    const ticket = await tx.ticket.create({
      data: {
        subject: value.subject,
        userId: user.id,
        messages: { create: { authorId: user.id, message: value.message } },
      },
    });
    await writeAudit(tx, user.id, "TICKET_CREATED", "Ticket", ticket.id);
    return ticket;
  });

  BALE_SendMessage(`${emojis.envelop} تیکت جدید
            کاربر : ${user.name}
            موضوع : ${data.subject}
            
            ${input.message}
            
            ${bale_hashtags.ticket_opened}
            `);

  refreshTickets();
  return { success: true, data };
}

async function reply(
  id: string,
  message: string,
  actorId: string,
  admin: boolean,
) {
  const text = messageSchema.parse(message);
  await prisma.$transaction(async (tx) => {
    // Lock/update the parent first: closing and replying serialize on this row.
    const updated = await tx.ticket.updateMany({
      where: { id, status: "OPEN", ...(!admin ? { userId: actorId } : {}) },
      data: { updatedAt: new Date() },
    });
    if (!updated.count) throw new Error("تیکت بسته شده یا در دسترس نیست");
    await tx.ticketMessage.create({
      data: {
        ticketId: id,
        authorId: actorId,
        fromAdmin: admin,
        message: text,
      },
    });
    await writeAudit(tx, actorId, "TICKET_REPLIED", "Ticket", id);
  });
  refreshTickets(id);
  return { success: true };
}

export async function ReplyTicketAction(id: string, message: string) {
  const user = await requireUser();
  return reply(id, message, user.id, false);
}

export async function ADMIN_ReplyTicketAction(id: string, message: string) {
  const user = await requireAdmin();
  return reply(id, message, user.id, true);
}

async function close(id: string, actorId: string, admin: boolean) {
  await prisma.$transaction(async (tx) => {
    const updated = await tx.ticket.updateMany({
      where: { id, status: "OPEN", ...(!admin ? { userId: actorId } : {}) },
      data: { status: "CLOSED" },
    });
    if (!updated.count) throw new Error("تیکت بسته شده یا در دسترس نیست");
    await writeAudit(tx, actorId, "TICKET_CLOSED", "Ticket", id);
  });
  refreshTickets(id);
  return { success: true };
}

export async function CloseTicketAction(id: string) {
  const user = await requireUser();
  return close(id, user.id, false);
}

export async function ADMIN_CloseTicketAction(id: string) {
  const user = await requireAdmin();
  return close(id, user.id, true);
}
