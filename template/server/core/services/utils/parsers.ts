export function StringToObject(
    str: string,
    listSplitter = ',',
    entitySplitter = ':',
): Record<string, string> {
    return Object.fromEntries(
        str
            .split(listSplitter)
            .map((el): [string, string] | null => {
                const [key, value] = el.split(entitySplitter);
                return key && value ? [key, value] : null;
            })
            .filter(
                (entry): entry is [string, string] => entry !== null
            )
    );
}


export function UnitsToDecimal(
    value: string | number | bigint,
    decimals: number,
    isMakeFloat: boolean = false,
): string | number {
    const str = BigInt(value)
        .toString()
        .padStart(decimals + 1, '0');
    const intPart = str.slice(0, -decimals) || '0';
    const fracPart = str.slice(-decimals).replace(/0+$/, '') || '0';
    const resStr = `${intPart}.${fracPart}`;
    return isMakeFloat ? parseFloat(resStr) : resStr;
}

export function parseQueryString(str: string): Record<string, string> {
    return Object.fromEntries(new URLSearchParams(str)) as Record<string, string>;
}

export function getValueByPath<T, R = unknown>(
    obj: T, path: string
): R | undefined {
    return path
        .split('.')
        .reduce<unknown>(
            (acc: unknown, key: string) =>
                typeof acc === 'object' && acc !== null
                    ? (acc as Record<string, unknown>)[key]
                    : undefined
            , obj
        ) as R | undefined;
}

export function parseErrorMessage(e: unknown): string {
    if (e instanceof Error) {
        return e.message;
    }

    if (typeof e === 'string') {
        return e;
    }

    try {
        return JSON.stringify(e);
    } catch {
        return 'Unserializable error';
    }
}