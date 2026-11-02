import EventEmitter from "eventemitter3";

const eventEmitter = new EventEmitter();

const Events = {
  on: <T>(event: string, fn: (payload: T) => void) =>
    eventEmitter.on(event, fn),

  once: <T>(event: string, fn: (payload: T) => void) =>
    eventEmitter.once(event, fn),

  off: <T>(event: string, fn: (payload: T) => void) =>
    eventEmitter.off(event, fn),

  emit: <T>(event: string, payload?: T) =>
    eventEmitter.emit(event, payload),

  removeListener: <T>(event: string, fn: (payload: T) => void) =>
    eventEmitter.removeListener(event, fn),
};

Object.freeze(Events);

export { Events };