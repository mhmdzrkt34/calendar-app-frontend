import { authAxios } from "../AxiosInstances";

export const getTasks = async () => {
  const response = await authAxios.get("/task/list");
  return response.data;
};

export const createTask = async ({ title, start_date, end_date, color, all_day = false }) => {
  const response = await authAxios.post("/task", { title, start_date, end_date, color, all_day });
  return response.data;
};

export const updateTask = async (public_key, updates) => {
  const response = await authAxios.patch(`/task/${public_key}`, updates);
  return response.data;
};

export const deleteTask = async (public_key) => {
  const response = await authAxios.delete(`/task/${public_key}`);
  return response.data;
};
