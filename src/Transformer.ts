import * as Immutable from "immutable";
import EventDelegate, { GenericEventListener } from "event-delegate";

export type ImmutablePath = (string | number)[];

export default abstract class Transformer<D extends Immutable.Map<string, any>> {
	private eventDelegate = new EventDelegate<D>();
	private batchUpdateStackSize = 0;

	constructor(private data: D, private transfoermerKey: any) {}

	public addDataChangedListener = (listener: GenericEventListener<D>): void => {
		this.eventDelegate.addEventListener(listener);
	};

	public removeDataChangedListener = (listener: GenericEventListener<D>): void => {
		this.eventDelegate.removeEventListener(listener);
	};

	public batchUpdate = (action: () => void): void => {
		const originalStackSize = this.batchUpdateStackSize;
		this.batchUpdateStackSize++;

		action();

		this.batchUpdateStackSize--;
		if (this.batchUpdateStackSize !== originalStackSize)
			throw "Batch update ended with an unexpected stack size!";

		this.triggerDataChanged();
	};

	public getData = (context: any): D => {
		if (context !== this.transfoermerKey)
			throw "Attempted to access data directly from transformer without proper key.";
		else
			return this.data;
	};

	public setData = (data: D): void => {
		this.data = data;
		this.triggerDataChanged();
	};

	protected mergeDataDeep(data: D) {
		this.data = this.data.mergeDeep(data) as D;
		this.triggerDataChanged();
	}

	protected concatAfter<T>(path: ImmutablePath, ...items: T[]): void {
		const list = this.getListAtPath<T>(path);
		this.setDataIn(
			path,
			list.concat(Immutable.fromJS(Array.prototype.concat(...items)))
		);
	}

	protected concatBefore<T>(path: ImmutablePath, ...items: T[]): void {
		const list = this.getListAtPath<T>(path);
		this.setDataIn(
			path,
			Immutable.fromJS(Array.prototype.concat(...items)).concat(list)
		);
	}

	protected pushData<T>(path: ImmutablePath, ...items: T[]): void {
		const list = this.getListAtPath(path);
		this.setDataIn(path, list.push(...items));
	}

	protected unshiftData<T>(path: ImmutablePath, ...items: T[]): void {
		const list = this.getListAtPath(path);
		this.setDataIn(path, list.unshift(...items));
	}

	protected insertDataAtIndex<T>(path: ImmutablePath, index: number, data: T): void {
		const list = this.getListAtPath(path);

		this.setDataIn(path, list.insert(index, data));
	}

	protected setDataIn(path: ImmutablePath, value: any): void {
		this.data = this.data.setIn(path, Immutable.fromJS(value)) as D;
		this.triggerDataChanged();
	}

	protected deleteDataIn(path: ImmutablePath): void {
		const basePath = path.slice(0, path.length - 1);
		const baseObject = this.data.getIn(basePath);

		if (Immutable.List.isList(baseObject)) {
			const index = path[path.length - 1] as number;
			this.setDataIn(basePath, (baseObject as Immutable.List<any>).splice(index, 1));
		} else {
			this.data = this.data.deleteIn(path) as D;
			this.triggerDataChanged();
		}

	}

	protected spliceDataIn<T>(path: ImmutablePath, index: number, count: number, ...values: T[]): void {
		const list = this.getListAtPath(path);

		this.setDataIn(path, list.splice(index, count, ...values));
		this.triggerDataChanged();
	}

	protected moveEntryInList(path: ImmutablePath, fromIndex: number, toIndex: number): void {
		let list = this.getListAtPath(path);
		const entry = list.get(fromIndex);
		list = list.splice(fromIndex, 1) as Immutable.List<any>;
		this.setDataIn(path, list.insert(toIndex, entry));
	}

	private triggerDataChanged(): void {
		if (this.batchUpdateStackSize === 0) this.eventDelegate.trigger(this.data);
	}

	private getListAtPath<T>(path: ImmutablePath): Immutable.List<T> {
		const list: Immutable.List<T> = this.data.getIn(path);

		if (Immutable.List.isList(list))
			return list;
		else
			throw "object at path was not a list";
	}
}
