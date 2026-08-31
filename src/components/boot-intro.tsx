"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ASCII_BANNER,
  bootScript,
  parseCssDuration,
  stepDelayMs,
  type BootStep,
} from "@/lib/boot";

export function BootIntro({ onDone }: { onDone: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(false);
  const closedRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const script = useMemo(() => bootScript(), []);
  const [upto, setUpto] = useState(1);
  const [phase, setPhase] = useState<"loading" | "success">("loading");

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setPhase("success");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const exit = parseCssDuration(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--boot-dur-exit",
      ),
      320,
    );
    window.setTimeout(
      () => {
        closedRef.current = true;
        dialogRef.current?.close();
        onDoneRef.current();
      },
      reduce ? 150 : exit,
    );
  }, []);

  useLayoutEffect(() => {
    const node = dialogRef.current;
    if (!node || closedRef.current) return;
    // React strips the native `open` attr on each commit; put it back.
    if (!node.open) node.showModal();
    const onCancel = (event: Event) => {
      event.preventDefault();
      finish();
    };
    node.addEventListener("cancel", onCancel);
    return () => {
      node.removeEventListener("cancel", onCancel);
    };
  });

  useEffect(() => {
    let cancelled = false;
    const styles = getComputedStyle(document.documentElement);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hold = parseCssDuration(
      styles.getPropertyValue("--boot-dur-hold"),
      1400,
    );

    const pause = (ms: number) =>
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, ms);
      });

    async function play() {
      if (reduce) {
        setUpto(script.length);
        await pause(hold);
        if (!cancelled) finish();
        return;
      }
      for (let i = 1; i < script.length; i++) {
        const step = script[i - 1];
        await pause(step ? stepDelayMs(step, styles) : 90);
        if (cancelled) return;
        setUpto(i + 1);
      }
      await pause(hold);
      if (!cancelled) finish();
    }

    void play();
    const cap = window.setTimeout(() => {
      if (!cancelled) finish();
    }, 20_000);
    return () => {
      cancelled = true;
      window.clearTimeout(cap);
    };
  }, [finish, script]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ block: "end" });
  }, [upto]);

  const shown = script.slice(0, upto);
  const exiting = phase === "success";

  return (
    <dialog
      ref={dialogRef}
      className="boot"
      data-state={phase}
      aria-labelledby="boot-title"
      aria-busy={!exiting}
      aria-live="polite"
    >
      <h2 id="boot-title" className="sr-only">
        Installing rcikaym-porto
      </h2>
      <div className="boot__top">
        <p className="boot__pkg dim">rcikaym-porto</p>
        <Button
          type="button"
          variant="ghost"
          className="cmd boot-skip"
          disabled={exiting}
          data-state={exiting ? "success" : undefined}
          onClick={finish}
        >
          [ skip ]
        </Button>
      </div>
      <div className="boot__body">
        <div className="boot-ascii-wrap">
          {ASCII_BANNER.map((block) => (
            <pre key={block.id} className="boot-ascii" aria-hidden="true">
              {block.art}
            </pre>
          ))}
          <p className="sr-only">Rcikaym-Porto</p>
        </div>
        <div className="boot-log">
          {shown.map((step, index) => (
            <BootChunk key={index} step={step} />
          ))}
          <div ref={logEndRef} />
        </div>
      </div>
    </dialog>
  );
}

function BootChunk({ step }: { step: BootStep }) {
  if (step.kind === "cmd") {
    return (
      <p className="boot-line log-in">
        <span className="prompt">{step.prompt}$</span> {step.command}
      </p>
    );
  }
  if (step.kind === "line") {
    return <p className={`boot-line log-${step.tone}`}>{step.text}</p>;
  }
  if (step.kind === "fetch") {
    return (
      <p className="boot-line boot-fetch">
        <span className="boot-fetch__name">{step.pkg}</span>
        <span className="boot-fetch__track" aria-hidden="true">
          <span className="boot-fetch__fill" />
        </span>
      </p>
    );
  }
  if (step.kind === "bar") {
    return (
      <div
        className="boot-bar"
        role="progressbar"
        aria-label="Retrieving rcikaym-porto"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext="retrieving"
      >
        <span className="boot-bar__fill" />
      </div>
    );
  }
  return null;
}

export function BootGate() {
  return <div className="boot-gate" aria-hidden="true" />;
}
