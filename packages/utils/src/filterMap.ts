/**
 * Filter and map an array of items.
 * @param items - The array of items to filter and map.
 * @param mapper - The function to map the items.
 * @returns The filtered and mapped array.
 */
export const filterMap = <TItem, TValue>(
  items: ReadonlyArray<TItem>,
  mapper: (item: TItem, index: number) => TValue | null | undefined,
): Array<TValue> => {
  const result: Array<TValue> = [];
  for (const [index, item] of items.entries()) {
    const mapped = mapper(item, index);
    if (mapped != null) {
      result.push(mapped);
    }
  }
  return result;
};
