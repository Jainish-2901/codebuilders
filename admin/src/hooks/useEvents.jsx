import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL;
// Configure Axios
const api = axios.create({ baseURL: `${apiUrl}` });

export function useEvents(filter) {
  return useQuery({
    queryKey: ["events", filter],
    queryFn: async () => {
      const res = await api.get('/events');
      let data = res.data;

      // Client-side filtering to match standard backend response
      if (filter === 'upcoming') {
        data = data.filter(e => e.status === 'upcoming');
      } else if (filter === 'past') {
        data = data.filter(e => e.status === 'past');
      }
      
      return data;
    },
  });
}

export function useEvent(id) {
  return useQuery({
    queryKey: ["event", id],
    queryFn: async () => {
      const res = await api.get(`/events`);
      // Finding single event from list if ID endpoint not specific or to be safe
      // Ideally: const res = await api.get(`/events/${id}`);
      // For now, let's assume we fetch all or specific if backend supports it
      const event = res.data.find(e => e._id === id);
      return event;
    },
    enabled: !!id,
  });
}

export function useFeaturedEvents(limit = 3) {
  return useQuery({
    queryKey: ["featured-events", limit],
    queryFn: async () => {
      const res = await api.get('/events');
      // Filter for upcoming and take first 'limit'
      return res.data
        .filter(e => e.status === 'upcoming')
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, limit);
    },
  });
}

export function usePastEventsWithGallery() {
  return useQuery({
    queryKey: ["past-events-gallery"],
    queryFn: async () => {
      const res = await api.get('/events');
      // Filter for past events that have images
      return res.data.filter(
        e => e.status === 'past' && e.gallery_images && e.gallery_images.length > 0
      );
    },
  });
}