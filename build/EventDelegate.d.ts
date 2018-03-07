export declare type GenericEventListener<D> = (data: D) => void;
export default class EventDelegate<D> {
    private listeners;
    addEventListener(listener: GenericEventListener<D>): void;
    removeEventListener(listener: GenericEventListener<D>): void;
    trigger(data: D): void;
    getListenerCount(): number;
    hasListeners(): boolean;
}
