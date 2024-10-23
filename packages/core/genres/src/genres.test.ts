import * as Genres from "./genres";
import { describe, test, expect } from "vitest";

describe("flatten", () => {
  test("returns the given array as-is if it's empty", () => {
    expect(Genres.flatten([])).toEqual([]);
  });

  test("returns the given array as-is if there are no comma-separated values", () => {
    const genres = ["Alt Rock", "Blackgaze", "Pop-Rock"];
    expect(Genres.flatten(genres)).toEqual(genres);
  });

  test("flattens a single, comma-separated value", () => {
    const genres = ["Shoegaze, Post-Rock"];
    expect(Genres.flatten(genres)).toEqual(["Shoegaze", "Post-Rock"]);
  });

  test("flattens a combination of comma-separated value and regular array elements", () => {
    const genres = [
      "Shoegaze, Post-Rock",
      "Alt-Rock",
      "Blackgaze",
      "Pop-Rock, Indie",
    ];
    expect(Genres.flatten(genres)).toEqual([
      "Shoegaze",
      "Post-Rock",
      "Alt-Rock",
      "Blackgaze",
      "Pop-Rock",
      "Indie",
    ]);
  });
});

describe("addTo", () => {
  test("returns the current genres if the new genres are empty", () => {
    const currentGenres = ["Alt Rock", "Blackgaze", "Pop-Rock"];
    expect(Genres.addTo(currentGenres, [])).toEqual([
      "Alt Rock",
      "Pop-Rock",
      "Blackgaze",
    ]);
  });

  test("returns the new genres if the current genres are empty", () => {
    const newGenres = ["Alt Rock", "Blackgaze", "Pop-Rock"];
    expect(Genres.addTo([], newGenres)).toEqual([
      "Alt Rock",
      "Pop-Rock",
      "Blackgaze",
    ]);
  });

  test("returns a combined array if none of them contain duplicates", () => {
    const currentGenres = ["Alt Rock"];
    const newGenres = ["Blackgaze", "Pop-Rock"];
    expect(Genres.addTo(currentGenres, newGenres)).toEqual([
      "Alt Rock",
      "Pop-Rock",
      "Blackgaze",
    ]);
  });

  test("returns a combined, deduplicated array with both current and new genres", () => {
    const currentGenres = ["Alt Rock", "Blackgaze"];
    const newGenres = ["Blackgaze", "Pop-Rock"];
    expect(Genres.addTo(currentGenres, newGenres)).toEqual([
      "Alt Rock",
      "Pop-Rock",
      "Blackgaze",
    ]);
  });
});
