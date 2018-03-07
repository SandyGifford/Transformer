import "jest";
import * as Immutable from "immutable";
import Transformer from "../Transformer";

type TestData = { [key: string]: { [key: string]: number[] } };
type ImmutableTestData = Immutable.Map<string, { [key: string]: number[] }>;

class TestTransformer extends Transformer<ImmutableTestData> {
	public tPushData = this.pushData;
	public tSetDataIn = this.setDataIn;
	public tUnshiftData = this.unshiftData;
	public tConcatAfter = this.concatAfter;
	public tDeleteDataIn = this.deleteDataIn;
	public tSpliceDataIn = this.spliceDataIn;
	public tConcatBefore = this.concatBefore;
	public tMergeDataDeep = this.mergeDataDeep;
	public tMoveEntryInList = this.moveEntryInList;
	public tInsertDataAtIndex = this.insertDataAtIndex;
}

const transformerKey = {};

const emptyData: TestData = {};
const basicData: TestData = {
	a: { aa: [1, 2, 3], ab: [4, 5, 6], ac: [7, 8, 9] },
	b: { ba: [10, 11, 12], bb: [13, 14, 15], bc: [16, 17, 18] },
	c: { ca: [19, 20, 21], cb: [22, 23, 24], cc: [25, 26, 27] },
};

const immutableBasicData: ImmutableTestData = Immutable.fromJS(basicData);
const immutableEmptyData: ImmutableTestData = Immutable.fromJS(emptyData);

const makeTransformer = () => new TestTransformer(immutableBasicData, transformerKey);

describe("Transformer", () => {
	test("addEventListener", () => {
		const transformer = makeTransformer();
		const dataChagned = jest.fn();

		function listener1(data: ImmutableTestData) {
			expect(data.toJS()).toEqual({});
		}

		transformer.addDataChangedListener(dataChagned);
		transformer.addDataChangedListener(listener1);

		transformer.setData(Immutable.fromJS({}));
		transformer.setData(Immutable.fromJS({}));

		transformer.removeDataChangedListener(listener1);

		transformer.tSetDataIn(["a", "ab"], Immutable.fromJS([]));
		transformer.tSetDataIn(["b", "bb"], Immutable.fromJS([]));

		expect(dataChagned).toHaveBeenCalledTimes(4);
	});

	test("removeEventListener", () => {
		const transformer = makeTransformer();

		const dataChanged1 = jest.fn();
		const dataChanged2 = jest.fn();

		transformer.addDataChangedListener(dataChanged1);
		transformer.addDataChangedListener(dataChanged2);

		transformer.setData(Immutable.fromJS({}));

		transformer.removeDataChangedListener(dataChanged1);

		transformer.setData(Immutable.fromJS({}));
		transformer.setData(Immutable.fromJS({}));

		expect(dataChanged1).toHaveBeenCalledTimes(1);
		expect(dataChanged2).toHaveBeenCalledTimes(3);
	});

	test("batchUpdate", () => {
		const transformer = makeTransformer();
		const dataChanged = jest.fn();

		transformer.addDataChangedListener(dataChanged);

		transformer.batchUpdate(() => {
			expect(dataChanged).toHaveBeenCalledTimes(0);
			transformer.setData(Immutable.fromJS({}));
			expect(dataChanged).toHaveBeenCalledTimes(0);
			transformer.setData(Immutable.fromJS({}));
			expect(dataChanged).toHaveBeenCalledTimes(0);
		});

		expect(dataChanged).toHaveBeenCalledTimes(1);
	});

	test("getData/setData", () => {
		const transformer = makeTransformer();

		expect(transformer.getData(transformerKey).toJS()).toEqual(basicData);
		transformer.setData(immutableEmptyData);
		expect(transformer.getData(transformerKey).toJS()).toEqual(emptyData);

		// non-matching key
		expect(() => transformer.getData({}).equals(immutableEmptyData)).toThrow();
	});

	test("mergeDataDeep", () => {
		const transformer = makeTransformer();
		const otherData: TestData = {
			a: {
				ab: [100],
				ac: null,
			},
			b: {
				blah: [10],
			},
		};

		transformer.tMergeDataDeep(Immutable.fromJS(otherData));

		expect(transformer.getData(transformerKey).toJS()).toEqual({
			a: { aa: [1, 2, 3], ab: [100, 5, 6], ac: null },
			b: {
				ba: [10, 11, 12],
				bb: [13, 14, 15],
				bc: [16, 17, 18],
				blah: [10],
			},
			c: { ca: [19, 20, 21], cb: [22, 23, 24], cc: [25, 26, 27] },
		});
	});

	describe("concatAfter", () => {
		it("should work with a single item", () => {
			const transformer = makeTransformer();
			transformer.tConcatAfter(["a", "aa"], [4, 5, 6]);

			expect(transformer.getData(transformerKey).toJS()).toEqual({
				a: {
					aa: [1, 2, 3, 4, 5, 6],
					ab: [4, 5, 6],
					ac: [7, 8, 9],
				},
				b: { ba: [10, 11, 12], bb: [13, 14, 15], bc: [16, 17, 18] },
				c: { ca: [19, 20, 21], cb: [22, 23, 24], cc: [25, 26, 27] },
			});
		});

		it("should work with multiple items", () => {
			const transformer = makeTransformer();
			transformer.tConcatAfter(["a", "ab"], [100, 1000], [200, 2000]);

			expect(transformer.getData(transformerKey).toJS()).toEqual({
				a: {
					aa: [1, 2, 3],
					ab: [4, 5, 6, 100, 1000, 200, 2000],
					ac: [7, 8, 9],
				},
				b: { ba: [10, 11, 12], bb: [13, 14, 15], bc: [16, 17, 18] },
				c: { ca: [19, 20, 21], cb: [22, 23, 24], cc: [25, 26, 27] },
			});
		});

		it("should throw exeptions when appropriate", () => {
			const transformer = makeTransformer();

			// no list at path
			expect(() => transformer.tConcatAfter(["a"], 1)).toThrow();
		});
	});

	describe("concatBefore", () => {
		it("should work with a single item", () => {
			const transformer = makeTransformer();
			transformer.tConcatBefore(["a", "aa"], [-2, -1, 0]);

			expect(transformer.getData(transformerKey).toJS()).toEqual({
				a: {
					aa: [-2, -1, 0, 1, 2, 3],
					ab: [4, 5, 6],
					ac: [7, 8, 9],
				},
				b: { ba: [10, 11, 12], bb: [13, 14, 15], bc: [16, 17, 18] },
				c: { ca: [19, 20, 21], cb: [22, 23, 24], cc: [25, 26, 27] },
			});
		});

		it("should work with multiple items", () => {
			const transformer = makeTransformer();
			transformer.tConcatBefore(["a", "ab"], [100, 1000], [200, 2000]);

			expect(transformer.getData(transformerKey).toJS()).toEqual({
				a: {
					aa: [1, 2, 3],
					ab: [100, 1000, 200, 2000, 4, 5, 6],
					ac: [7, 8, 9],
				},
				b: { ba: [10, 11, 12], bb: [13, 14, 15], bc: [16, 17, 18] },
				c: { ca: [19, 20, 21], cb: [22, 23, 24], cc: [25, 26, 27] },
			});
		});

		it("should throw exeptions when appropriate", () => {
			const transformer = makeTransformer();

			// no list at path
			expect(() => transformer.tConcatBefore(["a"], 1)).toThrow();
		});
	});

	describe("pashData", () => {
		it("should work with a single item", () => {
			const transformer = makeTransformer();
			transformer.tPushData(["a", "aa"], 4);

			expect(transformer.getData(transformerKey).toJS()).toEqual({
				a: {
					aa: [1, 2, 3, 4],
					ab: [4, 5, 6],
					ac: [7, 8, 9]
				},
				b: { ba: [10, 11, 12], bb: [13, 14, 15], bc: [16, 17, 18] },
				c: { ca: [19, 20, 21], cb: [22, 23, 24], cc: [25, 26, 27] },
			});
		});

		it("should work with multiple items", () => {
			const transformer = makeTransformer();
			transformer.tPushData(["a", "ab"], 100, 1000);

			expect(transformer.getData(transformerKey).toJS()).toEqual({
				a: {
					aa: [1, 2, 3],
					ab: [4, 5, 6, 100, 1000],
					ac: [7, 8, 9]
				},
				b: { ba: [10, 11, 12], bb: [13, 14, 15], bc: [16, 17, 18] },
				c: { ca: [19, 20, 21], cb: [22, 23, 24], cc: [25, 26, 27] },
			});
		});

		it("should throw exceptions when appropriate", () => {
			const transformer = makeTransformer();

			// no list at path
			expect(() => transformer.tPushData(["a"], 1)).toThrow();
		});
	});

	describe("unshiftData", () => {
		it("should work with a single item", () => {
			const transformer = makeTransformer();
			transformer.tUnshiftData(["a", "aa"], 4);

			expect(transformer.getData(transformerKey).toJS()).toEqual({
				a: {
					aa: [4, 1, 2, 3],
					ab: [4, 5, 6],
					ac: [7, 8, 9]
				},
				b: { ba: [10, 11, 12], bb: [13, 14, 15], bc: [16, 17, 18] },
				c: { ca: [19, 20, 21], cb: [22, 23, 24], cc: [25, 26, 27] },
			});
		});

		it("should work with multiple items", () => {
			const transformer = makeTransformer();
			transformer.tUnshiftData(["a", "ab"], 100, 1000);

			expect(transformer.getData(transformerKey).toJS()).toEqual({
				a: {
					aa: [1, 2, 3],
					ab: [100, 1000, 4, 5, 6],
					ac: [7, 8, 9]
				},
				b: { ba: [10, 11, 12], bb: [13, 14, 15], bc: [16, 17, 18] },
				c: { ca: [19, 20, 21], cb: [22, 23, 24], cc: [25, 26, 27] },
			});
		});

		it("should throw exceptions when appropriate", () => {
			const transformer = makeTransformer();

			// no list at path
			expect(() => transformer.tUnshiftData(["a"], 1)).toThrow();
		});
	});

	describe("insertDataAtIndex", () => {
		it("should be able to insert data at beginning of list", () => {
			const transformer = makeTransformer();
			transformer.tInsertDataAtIndex(["a", "aa"], 0, -1);

			expect(transformer.getData(transformerKey).toJS()).toEqual({
				a: { aa: [-1, 1, 2, 3], ab: [4, 5, 6], ac: [7, 8, 9] },
				b: { ba: [10, 11, 12], bb: [13, 14, 15], bc: [16, 17, 18] },
				c: { ca: [19, 20, 21], cb: [22, 23, 24], cc: [25, 26, 27] },
			});
		});

		it("should be able to insert data at beginning of list", () => {
			const transformer = makeTransformer();
			transformer.tInsertDataAtIndex(["a", "ab"], 1, 4.5);

			expect(transformer.getData(transformerKey).toJS()).toEqual({
				a: { aa: [1, 2, 3], ab: [4, 4.5, 5, 6], ac: [7, 8, 9] },
				b: { ba: [10, 11, 12], bb: [13, 14, 15], bc: [16, 17, 18] },
				c: { ca: [19, 20, 21], cb: [22, 23, 24], cc: [25, 26, 27] },
			});
		});

		it("should be able to insert data at beginning of list", () => {
			const transformer = makeTransformer();
			transformer.tInsertDataAtIndex(["a", "ac"], 3, 100);

			expect(transformer.getData(transformerKey).toJS()).toEqual({
				a: { aa: [1, 2, 3], ab: [4, 5, 6], ac: [7, 8, 9, 100] },
				b: { ba: [10, 11, 12], bb: [13, 14, 15], bc: [16, 17, 18] },
				c: { ca: [19, 20, 21], cb: [22, 23, 24], cc: [25, 26, 27] },
			});
		});

		it("should throw exceptions when appropriate", () => {
			const transformer = makeTransformer();

			// Throw if no list at path
			expect(() => transformer.tInsertDataAtIndex(["a"], 0, 1)).toThrow();
		});
	});

	describe("setDataIn", () => {
		it("should be able to set data over arrays", () => {
			const transformer = makeTransformer();
			transformer.tSetDataIn(["a", "aa"], [-100, -10, -1, 0]);

			expect(transformer.getData(transformerKey).toJS()).toEqual({
				a: { aa: [-100, -10, -1, 0], ab: [4, 5, 6], ac: [7, 8, 9] },
				b: { ba: [10, 11, 12], bb: [13, 14, 15], bc: [16, 17, 18] },
				c: { ca: [19, 20, 21], cb: [22, 23, 24], cc: [25, 26, 27] },
			});
		});

		it("should be able to set data over objects", () => {
			const transformer = makeTransformer();
			transformer.tSetDataIn(["b"], { blah: [-100, -10, -1, 0] });

			expect(transformer.getData(transformerKey).toJS()).toEqual({
				a: { aa: [1, 2, 3], ab: [4, 5, 6], ac: [7, 8, 9] },
				b: { blah: [-100, -10, -1, 0] },
				c: { ca: [19, 20, 21], cb: [22, 23, 24], cc: [25, 26, 27] },
			});
		});

		it("should be able to set data over primitives", () => {
			const transformer = makeTransformer();
			transformer.tSetDataIn(["c", "ca", 2], 100);

			expect(transformer.getData(transformerKey).toJS()).toEqual({
				a: { aa: [1, 2, 3], ab: [4, 5, 6], ac: [7, 8, 9] },
				b: { ba: [10, 11, 12], bb: [13, 14, 15], bc: [16, 17, 18] },
				c: { ca: [19, 20, 100], cb: [22, 23, 24], cc: [25, 26, 27] },
			});
		});
	});

	describe("deleteDataIn", () => {
		it("should be able to delete objects", () => {
			const transformer = makeTransformer();
			transformer.tDeleteDataIn(["a"]);

			expect(transformer.getData(transformerKey).toJS()).toEqual({
				b: { ba: [10, 11, 12], bb: [13, 14, 15], bc: [16, 17, 18] },
				c: { ca: [19, 20, 21], cb: [22, 23, 24], cc: [25, 26, 27] },
			});
		});

		it("should be able to delete arrays", () => {
			const transformer = makeTransformer();
			transformer.tDeleteDataIn(["b", "bb"]);

			expect(transformer.getData(transformerKey).toJS()).toEqual({
				a: { aa: [1, 2, 3], ab: [4, 5, 6], ac: [7, 8, 9] },
				b: { ba: [10, 11, 12], bc: [16, 17, 18] },
				c: { ca: [19, 20, 21], cb: [22, 23, 24], cc: [25, 26, 27] },
			});
		});

		it("should be able to delete items in arrays", () => {
			const transformer = makeTransformer();
			transformer.tDeleteDataIn(["c", "cc", 1]);

			expect(transformer.getData(transformerKey).toJS()).toEqual({
				a: { aa: [1, 2, 3], ab: [4, 5, 6], ac: [7, 8, 9] },
				b: { ba: [10, 11, 12], bb: [13, 14, 15], bc: [16, 17, 18] },
				c: { ca: [19, 20, 21], cb: [22, 23, 24], cc: [25, 27] },
			});
		});
	});

	describe("spliceDataIn", () => {
		it("should be able to splice out a single item without adding any", () => {
			const transformer = makeTransformer();
			transformer.tSpliceDataIn(["c", "cc"], 1, 1);

			expect(transformer.getData(transformerKey).toJS()).toEqual({
				a: { aa: [1, 2, 3], ab: [4, 5, 6], ac: [7, 8, 9] },
				b: { ba: [10, 11, 12], bb: [13, 14, 15], bc: [16, 17, 18] },
				c: { ca: [19, 20, 21], cb: [22, 23, 24], cc: [25, 27] },
			});
		});

		it("should be able to splice out multiple items without adding any", () => {
			const transformer = makeTransformer();
			transformer.tSpliceDataIn(["a", "ab"], 0, 2);

			expect(transformer.getData(transformerKey).toJS()).toEqual({
				a: { aa: [1, 2, 3], ab: [6], ac: [7, 8, 9] },
				b: { ba: [10, 11, 12], bb: [13, 14, 15], bc: [16, 17, 18] },
				c: { ca: [19, 20, 21], cb: [22, 23, 24], cc: [25, 26, 27] },
			});
		});

		it("should be able to splice out a single item and add a single item back", () => {
			const transformer = makeTransformer();
			transformer.tSpliceDataIn(["c", "cc"], 1, 1, 100);

			expect(transformer.getData(transformerKey).toJS()).toEqual({
				a: { aa: [1, 2, 3], ab: [4, 5, 6], ac: [7, 8, 9] },
				b: { ba: [10, 11, 12], bb: [13, 14, 15], bc: [16, 17, 18] },
				c: { ca: [19, 20, 21], cb: [22, 23, 24], cc: [25, 100, 27] },
			});
		});

		it("should be able to splice out multiple items and add a single item back", () => {
			const transformer = makeTransformer();
			transformer.tSpliceDataIn(["a", "ab"], 0, 2, 300);

			expect(transformer.getData(transformerKey).toJS()).toEqual({
				a: { aa: [1, 2, 3], ab: [300, 6], ac: [7, 8, 9] },
				b: { ba: [10, 11, 12], bb: [13, 14, 15], bc: [16, 17, 18] },
				c: { ca: [19, 20, 21], cb: [22, 23, 24], cc: [25, 26, 27] },
			});
		});

		it("should be able to splice out a single item and add multiple items back", () => {
			const transformer = makeTransformer();
			transformer.tSpliceDataIn(["c", "cc"], 1, 1, 100, 200);

			expect(transformer.getData(transformerKey).toJS()).toEqual({
				a: { aa: [1, 2, 3], ab: [4, 5, 6], ac: [7, 8, 9] },
				b: { ba: [10, 11, 12], bb: [13, 14, 15], bc: [16, 17, 18] },
				c: { ca: [19, 20, 21], cb: [22, 23, 24], cc: [25, 100, 200, 27] },
			});
		});

		it("should be able to splice out multiple items and add multiple items back", () => {
			const transformer = makeTransformer();
			transformer.tSpliceDataIn(["a", "ab"], 0, 2, 300, 400);

			expect(transformer.getData(transformerKey).toJS()).toEqual({
				a: { aa: [1, 2, 3], ab: [300, 400, 6], ac: [7, 8, 9] },
				b: { ba: [10, 11, 12], bb: [13, 14, 15], bc: [16, 17, 18] },
				c: { ca: [19, 20, 21], cb: [22, 23, 24], cc: [25, 26, 27] },
			});
		});

		it("should throw exeptions when appropriate", () => {
			const transformer = makeTransformer();

			// no list at path
			expect(() => transformer.tConcatAfter(["a"], 1)).toThrow();
		});
	});

	describe("moveEntryInList", () => {
		it("should be able to move an item forward", () => {
			const transformer = makeTransformer();
			transformer.tMoveEntryInList(["a", "aa"], 0, 1);

			expect(transformer.getData(transformerKey).toJS()).toEqual({
				a: { aa: [2, 1, 3], ab: [4, 5, 6], ac: [7, 8, 9] },
				b: { ba: [10, 11, 12], bb: [13, 14, 15], bc: [16, 17, 18] },
				c: { ca: [19, 20, 21], cb: [22, 23, 24], cc: [25, 26, 27] },
			});
		});

		it("should be able to move an item backwards", () => {
			const transformer = makeTransformer();
			transformer.tMoveEntryInList(["b", "bc"], 2, 0);

			expect(transformer.getData(transformerKey).toJS()).toEqual({
				a: { aa: [1, 2, 3], ab: [4, 5, 6], ac: [7, 8, 9] },
				b: { ba: [10, 11, 12], bb: [13, 14, 15], bc: [18, 16, 17] },
				c: { ca: [19, 20, 21], cb: [22, 23, 24], cc: [25, 26, 27] },
			});
		});

		it("should be able to put an item back in its original place", () => {
			const transformer = makeTransformer();
			transformer.tMoveEntryInList(["c", "ca"], 1, 1);

			expect(transformer.getData(transformerKey).toJS()).toEqual({
				a: { aa: [1, 2, 3], ab: [4, 5, 6], ac: [7, 8, 9] },
				b: { ba: [10, 11, 12], bb: [13, 14, 15], bc: [16, 17, 18] },
				c: { ca: [19, 20, 21], cb: [22, 23, 24], cc: [25, 26, 27] },
			});
		});

		it("should throw exceptions when appropriate", () => {
			const transformer = makeTransformer();

			// Throw if no list at path
			expect(() => transformer.tMoveEntryInList(["a"], 0, 1)).toThrow();
		});
	});
});
