"use client";

import { useEffect, useReducer, useState } from "react";
import { defend, newGame, nextDay, status, toggleBluff, toggleMint, type Game } from "@/engine/game";

export type Move = "defend" | "mint" | "bluff" | "next" | "restart";

/** How long one simulated hour stays on screen. */
const HOUR_MS = 36;
/** The pause between days once the spiral is running by itself. */
const SPIRAL_PAUSE_MS = 500;

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function apply(game: Game, move: Move): Game {
  switch (move) {
    case "defend":
      return defend(game);
    case "mint":
      return toggleMint(game);
    case "bluff":
      return toggleBluff(game);
    case "next":
      return nextDay(game);
    case "restart":
      return newGame();
  }
}

/** The game, and the hour the screen has reached: a played day is replayed quickly, hour by hour. */
export function useGame() {
  const [game, play] = useReducer(apply, undefined, () => newGame());
  const [shown, setShown] = useState(0);
  const lastIndex = game.points.length - 1;
  const moving = shown < lastIndex;

  useEffect(() => {
    if (!moving) return;
    const timer = setTimeout(() => setShown(reducedMotion() ? lastIndex : shown + 1), HOUR_MS);
    return () => clearTimeout(timer);
  }, [moving, shown, lastIndex]);

  // Once the spiral has started the player has no more say: the days go by on their own.
  const spiralRunning = !moving && status(game) === "spiral";
  useEffect(() => {
    if (!spiralRunning) return;
    const timer = setTimeout(() => play("next"), SPIRAL_PAUSE_MS);
    return () => clearTimeout(timer);
  }, [spiralRunning, game.day]);

  const restart = () => {
    play("restart");
    setShown(0);
  };

  return { game, point: game.points[shown], moving, play, restart };
}
