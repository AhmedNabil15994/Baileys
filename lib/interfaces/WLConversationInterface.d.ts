export default interface WLConversationInterface {
    id: string;
    unreadCount: number;
    readOnly: boolean;
    ephemeralExpiration: number;
    ephemeralSettingTimestamp: string;
    conversationTimestamp: string;
    notSpam: boolean;
    archived: boolean;
    disappearingMode: {
        initiator: string;
    };
    unreadMentionCount: number;
    tcToken: string;
    tcTokenTimestamp: string;
    contactPrimaryIdentityKey: string;
    tcTokenSenderTimestamp: string;
}
