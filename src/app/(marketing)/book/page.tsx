import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CalendarCheck } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { CONTAINER } from "@/lib/layout";
import { PageBanner } from "@/components/marketing/page-banner";
import { PAGE_BANNERS, toImageProp } from "@/lib/marketing-images";
import { getUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Book Appointment" };

export default async function BookPage() {
  const user = await getUser();
  if (user) redirect("/portal/appointments/book");

  return (
    <>
      <PageBanner
        eyebrow="Booking"
        title="Book your appointment"
        description="Sign in or create a free account to book online in a couple of clicks."
        image={toImageProp(PAGE_BANNERS.book)}
        className="min-h-[38vh]"
      />

      <section className="w-full py-20">
        <div className={CONTAINER}>
          <Card className="mx-auto max-w-md text-center">
            <CardHeader className="items-center">
              <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary">
                <CalendarCheck className="size-6" />
              </div>
              <CardTitle>Create an account or sign in</CardTitle>
              <CardDescription>Booking is available to registered patients so we can keep your records connected.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <ButtonLink href="/sign-up">Create an account</ButtonLink>
              <ButtonLink href="/login" variant="outline">
                Sign in
              </ButtonLink>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}
