export default interface WLConversationInterface {
  id: string,
  image: string,
  unreadCount: number,
  readOnly: boolean,
  conversationTimestamp: string,
  last_time: string,
  notSpam: boolean,
  archived: boolean,
  pinned: boolean,
  disappearingMode: {
    initiator: string
  },
  unreadMentionCount: number,
  image?:string,
  muted?:boolean,
  mutedUntil?:string,
  labeled?:string,
  labels?:array,
}