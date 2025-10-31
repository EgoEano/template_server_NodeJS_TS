export function StringToObject(
    str: string,
    listSplitter: string = ',',
    entitySplitter: string = ':'
): Record<string, string> {
    return Object.fromEntries(
        str.split(listSplitter).map((el: string) => el.split(entitySplitter))
    );
}

export function UnitsToDecimal(
    value: string | number | bigint,
    decimals: number,
    isMakeFloat: boolean = false
): string | number {
    const str = BigInt(value).toString().padStart(decimals + 1, '0');
    const intPart = str.slice(0, -decimals) || '0';
    const fracPart = str.slice(-decimals).replace(/0+$/, '') || '0';
    const resStr = `${intPart}.${fracPart}`;
    return isMakeFloat ? parseFloat(resStr) : resStr;
}

export function parseQueryString(str: string): Record<string, string> {
    return Object.fromEntries(new URLSearchParams(str)) as Record<string, string>;
}

export function getValueByPath<T = any, R = any>(obj: T, path: string): R | undefined {
    return path.split('.').reduce<any>((acc: any, key: string) => acc?.[key], obj);
}