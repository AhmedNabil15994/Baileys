export default interface WLContactInterface {
    id: string;
    /** name of the contact, you have saved on your WA */
    name?: string;
    /** name of the contact, the contact has set on their own on WA */
    notify?: string;
    /** I have no idea */
    verifiedName?: string;
    imgUrl?: string;
    status?: string;
    image?: string;
}
export default interface WLContactsInterface {
    chats: WLContactInterface[];
}
