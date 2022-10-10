declare const getSession: (sessionId: any) => any;
declare const init: () => void;
declare const deleteSession: (sessionId: any, clearInstance?: boolean) => void;
declare const createSession: (sessionId: any, res?: null) => Promise<void>;
export { createSession, getSession, deleteSession, init, };
