import { differenceInYears, format } from "date-fns";
import {
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  Shield,
  User,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EncounterWorkspacePatient } from "@/types/clinical";

interface PatientContextCardProps {
  patient: EncounterWorkspacePatient;
}

export function PatientContextCard({ patient }: PatientContextCardProps) {
  const age = patient.dob
    ? differenceInYears(new Date(), new Date(`${patient.dob}T00:00:00`))
    : null;

  const dobFormatted = patient.dob
    ? format(new Date(`${patient.dob}T00:00:00`), "MMM d, yyyy")
    : null;

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <User className="size-4 text-primary" />
          <span>Patient Demographics</span>
        </CardTitle>
        <ButtonLink
          href={`/patients/${patient.id}`}
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>Full Profile</span>
          <ExternalLink className="size-3" />
        </ButtonLink>
      </CardHeader>

      <CardContent className="space-y-3 text-xs sm:text-sm">
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-2.5">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground">DOB / Age</p>
            <p className="font-medium text-foreground">
              {dobFormatted ? `${dobFormatted} (${age}y)` : "Not provided"}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted-foreground">Gender</p>
            <p className="font-medium capitalize text-foreground">
              {patient.gender || "Not specified"}
            </p>
          </div>
        </div>

        <div className="space-y-2 pt-1">
          {patient.phone && (
            <div className="flex items-center gap-2">
              <Phone className="size-3.5 text-muted-foreground shrink-0" />
              <a
                href={`tel:${patient.phone}`}
                className="font-medium text-foreground hover:text-primary hover:underline"
              >
                {patient.phone}
              </a>
            </div>
          )}

          {patient.email && (
            <div className="flex items-center gap-2">
              <Mail className="size-3.5 text-muted-foreground shrink-0" />
              <a
                href={`mailto:${patient.email}`}
                className="truncate font-medium text-foreground hover:text-primary hover:underline"
              >
                {patient.email}
              </a>
            </div>
          )}

          {patient.address && (
            <div className="flex items-start gap-2">
              <MapPin className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <span className="text-muted-foreground">{patient.address}</span>
            </div>
          )}
        </div>

        {(patient.emergency_contact_name || patient.emergency_contact_phone) && (
          <div className="border-t border-border/50 pt-2.5">
            <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Shield className="size-3 text-primary" />
              <span>Emergency Contact</span>
            </p>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">
                {patient.emergency_contact_name || "Contact"}
              </span>
              {patient.emergency_contact_phone && (
                <a
                  href={`tel:${patient.emergency_contact_phone}`}
                  className="text-muted-foreground hover:text-primary hover:underline"
                >
                  {patient.emergency_contact_phone}
                </a>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
