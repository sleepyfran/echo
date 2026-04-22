import { grid } from "@lit-labs/virtualizer/layouts/grid.js";

type PixelSize = `0` | `${number}px`;
type AutoGapSpec =
  | PixelSize
  | `${PixelSize} ${PixelSize}`
  | `auto ${PixelSize}`
  | `${PixelSize} auto`;

type ResponsiveGridConfig = {
  containerWidth: number;
  idealItemWidth: number;
  minItemWidth: number;
  itemHeight: number | ((itemWidth: number) => number);
  paddingPx?: number;
  gap?: AutoGapSpec;
};

/**
 * Builds a Lit Virtualizer grid layout that keeps item widths responsive
 * to the available container space.
 *
 * `idealItemWidth` is the target width used to decide how many columns fit.
 * `minItemWidth` is the smallest width an item is allowed to shrink to.
 * `itemHeight` can be a fixed height or a callback that derives height from
 * the computed item width.
 * `paddingPx` and `gap` are forwarded to the underlying grid layout.
 */
export function createResponsiveGridLayout({
  containerWidth,
  idealItemWidth,
  minItemWidth,
  itemHeight,
  paddingPx = 16,
  gap = "0px",
}: ResponsiveGridConfig) {
  const availableWidth = Math.max(containerWidth - paddingPx * 2, minItemWidth);
  const columnCount = Math.max(1, Math.floor(availableWidth / idealItemWidth));
  const itemWidth = Math.max(
    minItemWidth,
    Math.floor(availableWidth / columnCount),
  );
  const resolvedItemHeight =
    typeof itemHeight === "function" ? itemHeight(itemWidth) : itemHeight;

  return grid({
    itemSize: {
      width: `${itemWidth}px`,
      height: `${resolvedItemHeight}px`,
    },
    gap,
    padding: `${paddingPx}px`,
  });
}

/**
 * A class that caches a value and its dependencies, avoiding unnecessary
 * re-renders unless the dependencies change.
 */
export class CachedValue<T> {
  private _value: T | undefined;
  private _previousDependencies: unknown[] = [];

  /**
   * Returns the underlying value that has been cached, or
   * undefined if no value has been cached.
   */
  get value(): T | undefined {
    return this._value;
  }

  /**
   * Sets the value of the cached item, only if the dependencies specified
   * in the `dependencies` parameter have changed.
   * Note: This method performs a shallow comparison of the dependencies,
   * so it may not detect changes in nested objects.
   * @param newValue The new value to cache.
   * @param dependencies The dependencies associated with the cached value.
   */
  setValue(newValue: T | undefined, dependencies: unknown[]) {
    if (!this._previousDependencies) {
      this._value = newValue;
      this._previousDependencies = dependencies;
      return;
    }

    const dependenciesChanged = dependencies.some(
      (dep, index) => dep !== this._previousDependencies[index],
    );

    if (dependenciesChanged) {
      this._value = newValue;
      this._previousDependencies = dependencies;
    }
  }
}
