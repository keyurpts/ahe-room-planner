import EventEmitter from "eventemitter3";
declare const Events: {
    on: <T>(event: string, fn: (payload: T) => void) => EventEmitter<string | symbol, any>;
    once: <T>(event: string, fn: (payload: T) => void) => EventEmitter<string | symbol, any>;
    off: <T>(event: string, fn: (payload: T) => void) => EventEmitter<string | symbol, any>;
    emit: <T>(event: string, payload?: T) => boolean;
    removeListener: <T>(event: string, fn: (payload: T) => void) => EventEmitter<string | symbol, any>;
};
export { Events };
