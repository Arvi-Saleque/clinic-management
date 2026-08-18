import Link from "next/link";
import { format } from "date-fns";
import { Clock3, Phone } from "lucide-react";

import { cn } from "@/lib/utils";
import type { listAppointmentsForDay } from "@/lib/server/directory";

type DailyAppointment = Awaited<ReturnType<typeof listAppointmentsForDay>>[number];

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8am to 8pm

const STATUS_STYLE: Record<string, string> = {
  pending: "border-l-warning bg-warning/9",
  confirmed: "border-l-blue-500 bg-blue-500/8",
  checked_in: "border-l-violet-500 bg-violet-500/8",
  completed: "border-l-success bg-success/8",
  cancelled: "border-l-destructive bg-destructive/8 opacity-60",
  no_show: "border-l-destructive bg-destructive/8 opacity-60",
};

export function DailyScheduleBoard({ appointments }: { appointments: DailyAppointment[] }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-[0_20px_52px_-44px_rgba(9,47,44,0.6)]">
      <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
        <div>
          <h2 className="font-heading text-lg font-extrabold">Today’s Schedule</h2>
          <p className="mt-1 text-xs text-muted-foreground">See today’s working hours, appointments and patient status at a glance.</p>
        </div>
        <div className="hidden items-center gap-3 text-[10px] text-muted-foreground sm:flex">
          <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-blue-500" />Confirmed</span>
          <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-violet-500" />Checked In</span>
          <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-success" />Completed</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="relative min-w-[760px] px-5 py-5 sm:px-6">
          <div className="ml-16 h-[768px] rounded-2xl border border-border bg-background-subtle/55">
            {HOURS.slice(0, -1).map((hour) => <div key={hour} className="h-16 border-b border-border/80 last:border-0" />)}
          </div>
          <div className="absolute left-5 top-5 w-14 sm:left-6">
            {HOURS.slice(0, -1).map((hour) => <div key={hour} className="h-16 pt-0.5 text-[10px] font-bold text-muted-foreground">{String(hour).padStart(2, "0")}:00</div>)}
          </div>
          <div className="absolute bottom-5 left-[84px] right-5 top-5 sm:left-[88px] sm:right-6">
            {appointments.map((appointment) => {
              const start = new Date(appointment.starts_at);
              const end = new Date(appointment.ends_at);
              const top = ((start.getHours() - 8) * 60 + start.getMinutes()) * (64 / 60);
              const height = Math.max(46, ((end.getTime() - start.getTime()) / 60000) * (64 / 60));
              const isFollowUp = appointment.originating_encounter_id != null;
              if (top < 0 || top > 768) return null;
              return (
                <Link key={appointment.id} href={`/patients/${appointment.patients?.id ?? ""}`} className={cn("absolute left-3 right-3 overflow-hidden rounded-xl border border-border border-l-4 bg-surface p-3 shadow-[0_14px_30px_-24px_rgba(5,40,38,0.75)] transition hover:z-10 hover:-translate-y-0.5 hover:shadow-lg", STATUS_STYLE[appointment.status])} style={{ top, height }}>
                  <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-1.5"><p className="truncate text-xs font-extrabold">{appointment.patients ? `${appointment.patients.first_name} ${appointment.patients.last_name}` : "Patient"}</p>{isFollowUp && <span className="shrink-0 rounded bg-primary-soft px-1.5 py-0.5 text-[9px] font-bold text-primary">Follow-up</span>}</div><p className="mt-1 truncate text-[10px] text-muted-foreground">{appointment.services?.name ?? "Dental visit"}{appointment.notes ? ` · ${appointment.notes}` : ""}</p></div><span className="shrink-0 rounded-md bg-surface/80 px-2 py-1 text-[10px] font-extrabold"><Clock3 className="mr-1 inline size-3" />{format(start, "HH:mm")}</span></div>
                  {height >= 70 && appointment.patients?.phone && <p className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground"><Phone className="size-3" />{appointment.patients.phone}</p>}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
