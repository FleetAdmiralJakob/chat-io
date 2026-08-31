export type MyNotesChatLike = {
  id?: string;
  chatId?: string;
  name?: string;
  type?: string;
  isNotes?: boolean;
};

export function isMyNotesChat(chat: unknown): boolean {
  if (!chat || typeof chat !== "object") {
    return false;
  }

  const candidate = chat as MyNotesChatLike;

  return (
    candidate.id === "my-notes" ||
    candidate.id === "myNotes" ||
    candidate.chatId === "my-notes" ||
    candidate.chatId === "myNotes" ||
    candidate.name?.toLowerCase() === "my notes" ||
    candidate.type === "notes" ||
    candidate.isNotes === true
  );
}
