"use client";

/**
 * ChatService — Abstraction Layer for Real-time Chat
 *
 * MIGRATION GUIDE:
 * ─────────────────────────────────────────────────────
 * Currently backed by Firebase RTDB.
 * To migrate to Socket.io:
 *   1. Replace the body of each function with Socket.io client calls.
 *   2. Components (ChatRoom.tsx) never import Firebase directly — only this service.
 *   3. Zero UI changes required.
 * ─────────────────────────────────────────────────────
 */

import {
  ref,
  push,
  query,
  limitToLast,
  onValue,
  serverTimestamp,
  off,
  type Unsubscribe,
  type DatabaseReference,
} from "firebase/database";
import { getFirebaseDatabase } from "@/lib/firebase-client";

export interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: number;       // Unix ms — guaranteed ordering for PostgreSQL import
  sequenceNumber?: number; // Set by server on archive; used for PostgreSQL ordering
  status: "sent" | "delivered";
}

export interface SendMessagePayload {
  senderId: string;
  content: string;
}

const MESSAGES_LIMIT = 50;

/**
 * Subscribe to the last N messages in a booking's chat room.
 * Returns an unsubscribe function to call on cleanup.
 */
export function subscribeToMessages(
  bookingId: string,
  onMessages: (messages: ChatMessage[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const db = getFirebaseDatabase();
  const chatRef: DatabaseReference = ref(db, `chats/${bookingId}/messages`);
  const chatQuery = query(chatRef, limitToLast(MESSAGES_LIMIT));

  const unsubscribe = onValue(
    chatQuery,
    (snapshot) => {
      const messages: ChatMessage[] = [];
      snapshot.forEach((child) => {
        messages.push({
          id: child.key!,
          ...(child.val() as Omit<ChatMessage, "id">),
        });
      });
      onMessages(messages);
    },
    (error) => {
      onError?.(error);
    }
  );

  return () => off(chatRef, "value", unsubscribe as never);
}

/**
 * Send a message to a booking's chat room.
 * Lightweight payload: only senderId, content, timestamp.
 * Profile data (name, photo) is resolved from app state.
 */
export async function sendMessage(
  bookingId: string,
  payload: SendMessagePayload
): Promise<void> {
  const db = getFirebaseDatabase();
  const chatRef = ref(db, `chats/${bookingId}/messages`);

  await push(chatRef, {
    senderId: payload.senderId,
    content: payload.content.trim(),
    timestamp: Date.now(), // Client timestamp for immediate optimistic ordering
    serverTimestamp: serverTimestamp(), // Firebase server timestamp for conflict resolution
    status: "sent",
  });
}


export interface ChatSessionMetadata {
  status: "active" | "closed";
  closedAt?: number;
  closedBy?: string;
}

/**
 * Subscribe to session metadata (open/closed status).
 * Fires immediately with current state, then on every change.
 * Used to switch ChatRoom to read-only when Muthawif closes the session.
 */
export function subscribeToSessionMetadata(
  bookingId: string,
  onMetadata: (meta: ChatSessionMetadata) => void
): Unsubscribe {
  const db = getFirebaseDatabase();
  const metaRef: DatabaseReference = ref(db, `chats/${bookingId}/metadata`);

  const unsubscribe = onValue(metaRef, (snapshot) => {
    if (!snapshot.exists()) {
      onMetadata({ status: "active" });
      return;
    }
    const val = snapshot.val();
    onMetadata({
      status: val.status ?? "active",
      closedAt: val.closedAt,
      closedBy: val.closedBy,
    });
  });

  return () => off(metaRef, "value", unsubscribe as never);
}
