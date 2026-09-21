export type ActionData<T> = T extends (...args: infer _Args) => Promise<{ data: infer TData }>
  ? TData
  : never
