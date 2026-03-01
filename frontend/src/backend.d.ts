import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface MediaFile {
    media: ExternalBlob;
    fileType: FileType;
}
export type Time = bigint;
export interface ConversationView {
    id: string;
    participants: Array<string>;
    messages: Array<Message>;
    name: string;
    admins?: Array<string>;
    timestamp: Time;
    conversationType: ConversationType;
}
export type UserId = string;
export type CreateUserResult = {
    __kind__: "authenticationError";
    authenticationError: string;
} | {
    __kind__: "userProfile";
    userProfile: UserProfile;
};
export interface Message {
    id: string;
    status: MessageStatus;
    content: string;
    deliveryTime?: Time;
    readTime?: Time;
    messageType: MessageType;
    conversationId: string;
    mediaFile?: MediaFile;
    timestamp: Time;
    senderId: string;
}
export interface UserProfile {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    statusMessage?: string;
    lastSeen: Time;
}
export enum ConversationType {
    group = "group",
    oneOnOne = "oneOnOne"
}
export enum FileType {
    video = "video",
    document_ = "document",
    image = "image"
}
export enum MessageStatus {
    read = "read",
    sent = "sent",
    delivered = "delivered"
}
export enum MessageType {
    file = "file",
    text = "text",
    image = "image"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    adminAssignRole(user: Principal, role: UserRole): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createGroupChat(participants: Array<UserId>, groupName: string): Promise<ConversationView>;
    createOneOnOneConversation(otherUserId: UserId): Promise<ConversationView>;
    createUser(username: string, displayName: string): Promise<CreateUserResult>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getContactById(userId: string): Promise<UserProfile | null>;
    getConversation(conversationId: string): Promise<ConversationView | null>;
    getMessages(conversationId: string, startIdx: bigint, count: bigint): Promise<Array<Message>>;
    getMyConversations(): Promise<Array<ConversationView>>;
    getUserProfile(userId: string): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    markMessageAsDelivered(conversationId: string, messageId: string): Promise<void>;
    markMessageAsRead(conversationId: string, messageId: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendMessage(conversationId: string, content: string, messageType: MessageType, mediaFile: MediaFile | null): Promise<Message>;
    updateLastSeen(): Promise<void>;
    uploadMedia(blob: ExternalBlob): Promise<ExternalBlob>;
}
