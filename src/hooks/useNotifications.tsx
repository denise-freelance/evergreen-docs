import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user?.user_id) return;
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.user_id)
      .order("created_at", { ascending: false })
      .limit(30);
    setNotifications((data || []) as Notification[]);
    setLoading(false);
  }, [user?.user_id]);

  useEffect(() => {
    if (!user?.user_id) {
      setNotifications([]);
      return;
    }
    load();

    const channel = supabase
      .channel(`notifications-${user.user_id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.user_id}` },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.user_id, load]);

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const markAllAsRead = async () => {
    if (!user?.user_id) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.user_id).eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead, reload: load };
}
