import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Message {
    content: string;
    sender: Principal;
    conversationId: string;
    timestamp: Time;
}
export type Time = bigint;
export interface backendInterface {
    clearConversation(conversationId: string): Promise<void>;
    getMessages(conversationId: string): Promise<Array<Message>>;
    postMessage(conversationId: string, content: string): Promise<void>;
}
