import * as Immutable from "immutable";
import { GenericEventListener } from "event-delegate";
export declare type ImmutablePath = (string | number)[];
export default abstract class Transformer<D extends Immutable.Map<string, any>> {
    private data;
    private transfoermerKey;
    private eventDelegate;
    private batchUpdateStackSize;
    constructor(data: D, transfoermerKey: any);
    addDataChangedListener: (listener: GenericEventListener<D>) => void;
    removeDataChangedListener: (listener: GenericEventListener<D>) => void;
    batchUpdate: (action: () => void) => void;
    getData: (context: any) => D;
    setData: (data: D) => void;
    protected mergeDataDeep(data: D): void;
    protected concatAfter<T>(path: ImmutablePath, ...items: T[]): void;
    protected concatBefore<T>(path: ImmutablePath, ...items: T[]): void;
    protected pushData<T>(path: ImmutablePath, ...items: T[]): void;
    protected unshiftData<T>(path: ImmutablePath, ...items: T[]): void;
    protected insertDataAtIndex<T>(path: ImmutablePath, index: number, data: T): void;
    protected setDataIn(path: ImmutablePath, value: any): void;
    protected deleteDataIn(path: ImmutablePath): void;
    protected spliceDataIn<T>(path: ImmutablePath, index: number, count: number, ...values: T[]): void;
    protected moveEntryInList(path: ImmutablePath, fromIndex: number, toIndex: number): void;
    private triggerDataChanged();
    private getListAtPath<T>(path);
}
