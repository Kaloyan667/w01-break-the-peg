import { DEFEND_STEP_USD, bluffStrength, dailyLimitUsd, type Game } from "@/engine/game";
import { money, percent } from "./format";
import { TRIGGER_CENTS } from "./log";
import type { Move } from "./useGame";

function Action({
  title,
  detail,
  note,
  on,
  pressable,
  disabled,
  onPress,
}: {
  title: string;
  detail: string;
  note?: string;
  on: boolean;
  /** A switch for the day, as opposed to a button that can be pressed again and again. */
  pressable: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      aria-pressed={pressable ? on : undefined}
      className="rounded-[10px] border border-line bg-surface p-4 text-left transition-colors hover:bg-fg/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-surface"
    >
      <span className="flex items-center gap-2 font-[510]">
        {title}
        {on && <i aria-hidden className="size-1.5 rounded-full bg-signal" />}
      </span>
      <span className="mt-1 block text-sm text-fg-2 text-pretty">{detail}</span>
      {note && <span className="mt-1 block text-sm text-fg-3 text-pretty">{note}</span>}
    </button>
  );
}

export function Controls({ game, moving, play }: { game: Game; moving: boolean; play: (move: Move) => void }) {
  const { plan, world } = game;
  const canDefend = world.reserveUsd - plan.defendUsd > 0;
  const strength = bluffStrength(game);

  return (
    <section aria-label="Your moves" className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
      <Action
        title="Defend with BTC"
        detail={
          plan.defendUsd > 0
            ? `${money(plan.defendUsd)} committed today, spent only if UST falls under ${TRIGGER_CENTS} cents.`
            : canDefend
              ? `Buy UST to hold the price. Each press adds ${money(DEFEND_STEP_USD)} for today.`
              : "The reserve is empty."
        }
        on={plan.defendUsd > 0}
        pressable={false}
        disabled={moving || !canDefend}
        onPress={() => play("defend")}
      />
      <Action
        title="Mint more LUNA"
        detail={`Raise today's limit from ${money(dailyLimitUsd(false))} to ${money(dailyLimitUsd(true))}. More UST burned, more LUNA printed.`}
        on={plan.mint}
        pressable
        disabled={moving}
        onPress={() => play("mint")}
      />
      <Action
        title="Raise yield / bluff"
        detail={strength > 0 ? `Hold back ${percent(strength)} of Anchor's withdrawals today.` : "Nobody believes you anymore."}
        note="Effect size is invented, not calibrated on data."
        on={plan.bluff}
        pressable
        disabled={moving || strength === 0}
        onPress={() => play("bluff")}
      />
      <button
        type="button"
        onClick={() => play("next")}
        disabled={moving}
        className="rounded-[10px] bg-fg px-8 py-4 font-[510] text-bg transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg disabled:cursor-not-allowed max-sm:fixed max-sm:inset-x-6 max-sm:bottom-4 max-sm:z-10 max-sm:shadow-lg disabled:opacity-50"
      >
        Next day
      </button>
    </section>
  );
}
