// lib/action-error.ts

type ActionErrorShape = {
  error: string;
  [key: string]: unknown; // other optional fields
};

export class ActionError extends Error {
  payload: ActionErrorShape;

  constructor(payload: ActionErrorShape) {
    super(JSON.stringify(payload)); // this survives the server->client boundary
    this.name = "ActionError";
    this.payload = payload;
  }
}

// Client-side helper to safely parse it back out
export function parseActionError(error: unknown): ActionErrorShape {
  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message);
      if (parsed && typeof parsed.error === "string") {
        return parsed;
      }
    } catch {
      // not JSON — fall through
    }
  }
  return { error: "Something went wrong. Please try again." };
}