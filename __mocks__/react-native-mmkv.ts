class MMKVMock {
  readonly id: string;
  private store = new Map<string, string | number | boolean>();

  constructor(config?: { id?: string }) {
    this.id = config?.id ?? 'mmkv.default';
  }

  get length(): number {
    return this.store.size;
  }

  set(key: string, value: string | number | boolean): void {
    this.store.set(key, value);
  }

  getString(key: string): string | undefined {
    const value = this.store.get(key);
    return typeof value === 'string' ? value : undefined;
  }

  getNumber(key: string): number | undefined {
    const value = this.store.get(key);
    return typeof value === 'number' ? value : undefined;
  }

  getBoolean(key: string): boolean | undefined {
    const value = this.store.get(key);
    return typeof value === 'boolean' ? value : undefined;
  }

  contains(key: string): boolean {
    return this.store.has(key);
  }

  remove(key: string): boolean {
    return this.store.delete(key);
  }

  getAllKeys(): string[] {
    return Array.from(this.store.keys());
  }

  clearAll(): void {
    this.store.clear();
  }

  trim(): void {}
}

export const createMMKV = (config?: { id?: string }) => new MMKVMock(config);
export const existsMMKV = () => true;
export const deleteMMKV = () => {};
export default { createMMKV, existsMMKV, deleteMMKV };
