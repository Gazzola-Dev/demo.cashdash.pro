export interface HookOptions<T, K = { id: string }> {
  updateData?: Partial<T> & K;
  errorMessage?: string;
  successMessage?: string;
  initialData?: T | null;
}
