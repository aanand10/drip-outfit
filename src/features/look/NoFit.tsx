import Link from "next/link";
import { track } from "@/lib/analytics";
import { LookGallery } from "@/components/outfit/LookGallery";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Label } from "@/components/ui/Label";
import type { RecommendResponse } from "@/domain/types";
import { formatINR } from "@/lib/format";
import { lookHref } from "@/lib/routes";

type NoFitResult = Extract<RecommendResponse, { status: "no_fit" }>;

// C2: no complete look fits. The closest one is shown greyed and marked over budget,
// never as a fit, with ways forward.
export function NoFit({ result, occasionLabel }: { result: NoFitResult; occasionLabel: string }) {
  const raise = result.suggestions.find((s) => s.type === "raise_budget");
  const others = result.suggestions.filter((s) => s.type === "other_occasion");
  const nextStep = (action: "raise_budget" | "other_occasion" | "change_inputs") => () =>
    track("no_fit_next_step_clicked", { action, occasion: result.occasion, budget: result.budget });

  return (
    <>
      <section className="bg-fg px-5 pt-24 pb-12 text-white">
        <Label className="text-accent">No complete look</Label>
        <h1 className="mt-3 animate-fade-up text-[38px] leading-[1] font-semibold tracking-[-0.045em]">
          {formatINR(result.budget)} doesn&apos;t cover a full {occasionLabel.toLowerCase()} look yet.
        </h1>
        <p className="mt-4 animate-fade-up text-[15px] leading-relaxed text-white/65 [animation-delay:100ms]">
          We won&apos;t show you half an outfit. The most affordable top, trousers and shoes that work together come
          to <span className="text-white">{formatINR(result.cheapestTotal)}</span>, {formatINR(result.shortBy)} more
          than you set.
        </p>
      </section>

      <div className="flex flex-1 flex-col px-4 pt-8 pb-10">
        {result.cheapestLook && (
          <>
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="text-[20px] font-medium tracking-[-0.02em]">Closest complete look</h2>
              <span className="text-[16px] font-semibold tabular-nums">{formatINR(result.cheapestTotal)}</span>
            </div>
            <LookGallery
              variant="card"
              items={result.cheapestLook}
              muted
              pill={{ text: `${formatINR(result.shortBy)} over budget`, tone: "alert" }}
            />
          </>
        )}

        <div className="mt-6 flex flex-col gap-2.5">
          {raise && raise.type === "raise_budget" && (
            <Link href={lookHref(result.occasion, raise.budget)} onClick={nextStep("raise_budget")} className={buttonClass("primary", "w-full")}>
              See it at {formatINR(raise.budget)} <Icon.Arrow width={18} height={18} />
            </Link>
          )}
          {others.map(
            (s) =>
              s.type === "other_occasion" && (
                <Link
                  key={s.occasion}
                  href={lookHref(s.occasion, result.budget)}
                  onClick={nextStep("other_occasion")}
                  className="flex min-h-14 items-center justify-between rounded-full border border-line px-6 transition hover:border-fg"
                >
                  <span className="text-[15px] font-semibold">
                    {s.label} look within {formatINR(result.budget)}
                  </span>
                  <Icon.Arrow width={18} height={18} />
                </Link>
              ),
          )}
          <Link
            href={`/?occasion=${result.occasion}&budget=${result.budget}`}
            onClick={nextStep("change_inputs")}
            className="mt-1 py-2 text-center text-[14px] text-muted underline underline-offset-4"
          >
            Change occasion or budget
          </Link>
        </div>
      </div>
    </>
  );
}
