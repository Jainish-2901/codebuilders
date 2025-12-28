import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL;

export const useExternalEvents = (type = null, status = null) => {
  return useQuery({
    queryKey: ["external-events", type, status],
    queryFn: async () => {
      const params = {};
      if (type) params.type = type;
      if (status) params.status = status;

      const response = await axios.get(`${apiUrl}/external-events`, { params });
      return response.data;
    },
  });
};

export const useExternalEvent = (id) => {
  return useQuery({
    queryKey: ["external-event", id],
    queryFn: async () => {
      const response = await axios.get(`${apiUrl}/external-events/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};