import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL;
const api = axios.create({ baseURL: `${apiUrl}` });

export function useSpeakers() {
  return useQuery({
    queryKey: ["speakers"],
    queryFn: async () => {
      const res = await api.get('/speakers');
      return res.data;
    },
  });
}

export function useFeaturedSpeakers(limit = 4) {
  return useQuery({
    queryKey: ["featured-speakers", limit],
    queryFn: async () => {
      const res = await api.get('/speakers');
      // Sort by creation date or any logic, then slice
      // Assuming 'createdAt' exists, otherwise just slice
      return res.data
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, limit);
    },
  });
}