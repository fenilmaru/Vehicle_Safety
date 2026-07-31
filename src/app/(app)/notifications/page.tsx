"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { FaBell, FaCheck, FaFilter } from "react-icons/fa6";
import { notificationApi } from "@/api/endpoints";
import { Badge, Button, Card, EmptyState, Loader, SectionTitle } from "@/components/ui/Primitives";
import { useApi } from "@/hooks/useApi";
import { markAllRead } from "@/redux/slices/notificationSlice";
import { useAppDispatch } from "@/redux/store";
import { fromNow, titleCase } from "@/utils/helpers";

const CATEGORIES = ["all", "accident", "emergency", "driver", "vehicle", "system"];

export default function NotificationsPage() {
  const { data, loading, refetch } = useApi(() => notificationApi.list(), { pollMs: 15000 });
  const dispatch = useAppDispatch();
  const [category, setCategory] = useState("all");

  if (loading && !data) return <Loader label="Loading notification stream" />;

  const rows = (data?.notifications ?? []).filter((n) => category === "all" || n.category === category);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="m-0 text-xl font-semibold tracking-tight">Notifications</h1>
          <p className="m-0 mt-1 text-sm text-muted">{data?.unread ?? 0} unread across the safety grid.</p>
        </div>
        <Button
          variant="ghost"
          onClick={async () => {
            await notificationApi.markRead();
            dispatch(markAllRead());
            toast.success("All notifications marked as read");
            void refetch();
          }}
        >
          <FaCheck /> Mark all read
        </Button>
      </div>

      <Card>
        <SectionTitle title="Filter" subtitle="Notification categories" icon={<FaFilter />} />
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((item) => (
            <button
              key={item}
              className={`chip ${category === item ? "chip-primary" : ""}`}
              onClick={() => setCategory(item)}
              aria-pressed={category === item}
            >
              {titleCase(item)}
            </button>
          ))}
        </div>
      </Card>

      {!rows.length ? (
        <EmptyState title="Inbox clear" message="No notifications in this category." icon={<FaBell />} />
      ) : (
        <ul className="m-0 space-y-3 p-0">
          {rows.map((item, index) => (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className={`glass list-none p-4 ${item.isRead ? "opacity-70" : ""}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="m-0 text-sm font-semibold">{item.title}</h2>
                    <Badge tone={item.level === "critical" ? "danger" : item.level === "warning" ? "amber" : "primary"}>
                      {item.level}
                    </Badge>
                    <Badge>{titleCase(item.category)}</Badge>
                  </div>
                  <p className="m-0 mt-1 text-sm text-muted">{item.message}</p>
                  <p className="m-0 mt-1 text-[0.68rem] text-muted">{fromNow(item.createdAt)}</p>
                </div>
                {!item.isRead ? (
                  <button
                    className="chip chip-success"
                    onClick={async () => {
                      await notificationApi.markRead(item.id);
                      void refetch();
                    }}
                  >
                    <FaCheck /> Mark read
                  </button>
                ) : null}
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
