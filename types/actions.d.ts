export type ActionData<T extends (...args: any) => Promise<{ data: any }>> = 
  Awaited<ReturnType<T>>['data']
