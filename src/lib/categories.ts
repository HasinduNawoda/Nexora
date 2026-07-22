import { useEffect, useState } from "react";
import { api } from "./api";

export interface Category {
  id: number;
  name: string;
}

const CHANGE_EVENT = "nexora-categories-changed";
function notifyChange() {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
function subscribe(callback: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, callback);
  return () => window.removeEventListener(CHANGE_EVENT, callback);
}

let cache: Category[] = [];

export async function fetchCategories(): Promise<Category[]> {
  cache = await api.get<Category[]>("/categories");
  notifyChange();
  return cache;
}

export function getCategories(): Category[] {
  return cache;
}

/** React hook: components use this instead of getCategories() directly. */
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(cache);
  const [loading, setLoading] = useState(cache.length === 0);

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .finally(() => setLoading(false));
    return subscribe(() => setCategories(cache));
  }, []);

  return { categories, loading };
}

export async function createCategory(name: string): Promise<Category> {
  const created = await api.post<Category>("/categories", { name });
  await fetchCategories();
  return created;
}

export async function renameCategory(id: number, name: string): Promise<Category> {
  const updated = await api.put<Category>(`/categories/${id}`, { name });
  await fetchCategories();
  return updated;
}

export async function deleteCategory(id: number): Promise<void> {
  await api.delete(`/categories/${id}`);
  await fetchCategories();
}
