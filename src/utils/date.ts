import { format, formatDistanceToNow, formatRelative, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale/ar';

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd/MM/yyyy', { locale: ar });
};

export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd/MM/yyyy HH:mm', { locale: ar });
};

export const formatTimeAgo = (date: Date | string): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: ar });
};

export const formatRelativeDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatRelative(d, new Date(), { locale: ar });
};
