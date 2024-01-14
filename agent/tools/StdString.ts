export class StdString {

    private static STD_STRING_SIZE = 3 * Process.pointerSize

    handle: NativePointer

    constructor(mPtr: NativePointer = Memory.alloc(StdString.STD_STRING_SIZE)) {
        this.handle = mPtr
    }

    private dispose(): void {
        const [data, isTiny] = this._getData()
        if (!isTiny) (Java as any).api.$delete(data)
    }

    static fromPointer(ptrs: NativePointer): string {
        return StdString.fromPointers([ptrs, ptrs.add(Process.pointerSize), ptrs.add(Process.pointerSize * 2)])
    }

    static fromPointers(ptrs: NativePointer[]): string {
        if (ptrs.length != 3) return ''
        return StdString.fromPointersRetInstance(ptrs).disposeToString()
    }

    static from(pointer: NativePointer) {
        try {
            return pointer.add(Process.pointerSize * 2).readCString()
        } catch (error) {
            // LOGE("StdString.from ERROR" + error)
            return 'ERROR'
        }
    }

    private static fromPointersRetInstance(ptrs: NativePointer[]): StdString {
        if (ptrs.length != 3) return new StdString()
        const stdString = new StdString()
        stdString.handle.writePointer(ptrs[0])
        stdString.handle.add(Process.pointerSize).writePointer(ptrs[1])
        stdString.handle.add(2 * Process.pointerSize).writePointer(ptrs[2])
        return stdString
    }

    disposeToString(): string {
        const result = this.toString()
        this.dispose()
        return result
    }

    toString(): string {
        try {
            const data: NativePointer = this._getData()[0] as NativePointer
            return data.readUtf8String()
        } catch (error) {
            return StdString.from(this.handle.add(Process.pointerSize * 2))
        }
    }

    private _getData(): [NativePointer, boolean] {
        const str = this.handle
        const isTiny = (str.readU8() & 1) === 0
        const data = isTiny ? str.add(1) : str.add(2 * Process.pointerSize).readPointer()
        return [data, isTiny]
    }
}

Reflect.set(globalThis, 'StdString', StdString)