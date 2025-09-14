export const isNotNull = <T>(value: T | null): value is T => value != null;

export const assertNever = (value: never): never => {
    throw new Error(`Unhandled case: ${value}`);
}