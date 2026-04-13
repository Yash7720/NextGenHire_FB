import { apiRequest } from './http';

export const fetchNotifications = async () => {
  const data = await apiRequest('/api/notifications');
  return data?.data || [];
};

export const markNotificationsRead = async () => {
  const data = await apiRequest('/api/notifications/read', {
    method: 'PUT'
  });
  return data;
};
