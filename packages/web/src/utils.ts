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
