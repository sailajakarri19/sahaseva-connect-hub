import { createFileRoute, Outlet } from "@tanstack/react-router";
import { BottomNav, Phone } from "@/components/saha/shell";
import { useRequireRole } from "@/lib/session";
import { useNotificationRuntime } from "@/lib/notification-inbox";

export const Route = createFileRoute("/worker")({
  ssr: false,
  component: WorkerLayout,
});

function WorkerLayout() {
  useNotificationRuntime();
  const session = useRequireRole("WORKER");
  if (!session) {
    return (
      <Phone>
        <div className="grid min-h-[60vh] place-items-center text-sm text-muted-foreground">
          Checking your session…
        </div>
      </Phone>
    );
  }
  return (
    <Phone>
      <Outlet />
      <BottomNav variant="worker" />
    </Phone>
  );
}
