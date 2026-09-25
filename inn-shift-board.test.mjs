import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

function load() {
  const context = vm.createContext({});
  for (const name of ["inn-shift-board.js", "n2-inn-episodes.js"]) {
    vm.runInContext(fs.readFileSync(new URL("./" + name, import.meta.url), "utf8"), context);
  }
  return { board: context.LanternShiftBoard, episode: context.N2InnEpisodes.episodes[0] };
}

// A fixed "random" so arrivals do not wobble in these tests.
const still = () => 0.5;

function play(board, shift, secs, view, current) {
  const all = { warnings: [], tea: false };
  for (let i = 0; i < secs; i += 1) {
    const e = board.tick(shift, view || "board", current || null);
    all.warnings.push(...e.warnings);
    if (e.tea) all.tea = true;
  }
  return all;
}

test("Episode 1's shift covers each of its ten questions exactly once", () => {
  const { episode } = load();
  const asked = episode.days.flatMap((day) => day.questions.map((q) => q.id)).sort();
  const jobs = episode.shift.jobs.map((job) => job.id).sort();
  assert.deepEqual(jobs, asked);
  for (const job of episode.shift.jobs) {
    assert.ok(episode.shift.cast[job.who], job.id + " is asked by someone in the cast");
    assert.ok(job.board && job.board.length <= 40, job.id + " has a short board line");
    if ((job.lane || "guest") === "guest") assert.ok(job.patience > 0, job.id + " waits with a patience");
    if (job.after) assert.ok(episode.shift.jobs.some((j) => j.id === job.after), job.id + " follows a real job");
  }
});

test("a guest arrives on time, and a follow-up only after the job it follows", () => {
  const { board, episode } = load();
  const shift = board.create(episode.shift, "normal", still);
  const first = board.byId(shift, "inn-e01-q01");
  const dinner = board.byId(shift, "inn-e01-q02");
  assert.ok(board.available(shift, first), "the first guest is there at 18:00");
  play(board, shift, 60);
  assert.equal(board.available(shift, dinner), false, "dinner waits for the check-in");
  board.complete(shift, "inn-e01-q01", true);
  play(board, shift, dinner.gap * board.SEC_PER_MIN);
  assert.ok(board.available(shift, dinner), "dinner is asked for once the guests are in");
});

test("guests wait at full speed at the board, half while you help someone, a third while you help them", () => {
  const { board, episode } = load();
  const shift = board.create(episode.shift, "normal", still);
  const g = board.byId(shift, "inn-e01-q01");
  const start = g.left;
  board.tick(shift, "board", null);
  assert.equal(start - g.left, 1);
  board.tick(shift, "task", "inn-e01-q06");
  assert.equal(start - g.left, 1.5);
  board.tick(shift, "task", "inn-e01-q01");
  assert.ok(Math.abs(start - g.left - (1.5 + 1 / 3)) < 1e-9);
  assert.equal(board.drainRate(shift, board.byId(shift, "inn-e01-q06"), "board", null), 0, "desk jobs never wait");
});

test("difficulty changes how fast guests wait, and how much the evening pays", () => {
  const { board, episode } = load();
  const rates = ["hard", "normal", "easy"].map((key) => {
    const shift = board.create(episode.shift, key, still);
    return board.drainRate(shift, board.byId(shift, "inn-e01-q01"), "board", null);
  });
  assert.ok(rates[0] > rates[1] && rates[1] > rates[2], "hard > normal > easy: " + rates);
  assert.ok(board.LEVELS.hard.pay > board.LEVELS.normal.pay && board.LEVELS.normal.pay > board.LEVELS.easy.pay);
  assert.deepEqual([...board.LEVEL_ORDER], ["hard", "normal", "easy"]);
});

test("a guest running out of time is announced once as urgent and once as critical", () => {
  const { board, episode } = load();
  const shift = board.create(episode.shift, "normal", still);
  const events = play(board, shift, 39);
  const mine = events.warnings.filter((w) => w.id === "inn-e01-q01").map((w) => w.level);
  assert.deepEqual(mine, ["urgent", "critical"]);
});

test("the guest being helped is never announced, and Kon serves tea once someone waits too long", () => {
  const { board, episode } = load();
  const shift = board.create(episode.shift, "normal", still);
  const helping = play(board, shift, 100, "task", "inn-e01-q01");
  assert.equal(helping.warnings.filter((w) => w.id === "inn-e01-q01").length, 0);
  assert.equal(helping.tea, false);
  const late = play(board, shift, 60);
  assert.equal(late.tea, true, "tea is served once a guest has waited too long");
  assert.ok(board.drainRate(shift, board.byId(shift, "inn-e01-q01"), "board", null) < 1, "and everyone waits more patiently");
});

test("the countdown shows real seconds at the current speed", () => {
  const { board, episode } = load();
  const shift = board.create(episode.shift, "normal", still);
  const g = board.byId(shift, "inn-e01-q01");
  g.left = 10;
  assert.equal(board.secsLeft(shift, g, "board", null), 10);
  assert.equal(board.secsLeft(shift, g, "task", "inn-e01-q06"), 20);
  assert.equal(board.secsLeft(shift, g, "task", "inn-e01-q01"), 30);
});

test("the clock holds at 19:55 until the last job is done", () => {
  const { board, episode } = load();
  const shift = board.create(episode.shift, "normal", still);
  assert.equal(board.clockLabel(shift), "18:00");
  shift.sec = 500 * board.SEC_PER_MIN;
  assert.equal(board.clockLabel(shift), "19:55");
  shift.jobs.forEach((job) => { job.done = true; });
  assert.equal(board.clockLabel(shift), "20:00");
});

test("the rank is 100 points less 20 per guest kept too long and 10 per miss", () => {
  const { board, episode } = load();
  const shift = board.create(episode.shift, "normal", still);
  shift.jobs.forEach((job) => board.complete(shift, job.id, true));
  assert.equal(board.result(shift).rank.mark, "松");
  board.byId(shift, "inn-e01-q01").left = 0;
  board.byId(shift, "inn-e01-q06").firstTry = false;
  const r = board.result(shift);
  assert.equal(r.score, 70);
  assert.equal(r.rank.mark, "竹");
  board.byId(shift, "inn-e01-q03").left = 0;
  assert.equal(board.result(shift).rank.mark, "梅");
});

test("a finished job reports whether it was answered while the guest was still patient", () => {
  const { board, episode } = load();
  const shift = board.create(episode.shift, "normal", still);
  assert.deepEqual({ ...board.complete(shift, "inn-e01-q01", true) }, { fast: true, late: false });
  assert.equal(board.complete(shift, "inn-e01-q01", false), null, "a job finishes once");
  board.byId(shift, "inn-e01-q03").left = 0;
  shift.sec = 20;
  assert.deepEqual({ ...board.complete(shift, "inn-e01-q03", false) }, { fast: false, late: true });
  assert.equal(board.byId(shift, "inn-e01-q03").firstTry, false);
});

test("a saved evening restores, and a save from a different shift is refused", () => {
  const { board, episode } = load();
  const shift = board.create(episode.shift, "hard", still);
  play(board, shift, 30);
  board.complete(shift, "inn-e01-q01", true);
  const back = board.restore(episode.shift, JSON.parse(JSON.stringify(board.snapshot(shift))));
  assert.equal(back.sec, 30);
  assert.equal(back.level, "hard");
  assert.equal(board.byId(back, "inn-e01-q01").done, true);
  assert.equal(board.restore(episode.shift, { jobs: [{ id: "x" }] }), null);
});

test("arrivals vary a little each play, but the first guest is always there at 18:00", () => {
  const { board, episode } = load();
  const low = board.create(episode.shift, "normal", () => 0);
  const high = board.create(episode.shift, "normal", () => 0.99);
  assert.equal(board.byId(low, "inn-e01-q01").at, 0);
  assert.equal(board.byId(high, "inn-e01-q01").at, 0);
  assert.equal(board.byId(low, "inn-e01-q10").at, 36);
  assert.equal(board.byId(high, "inn-e01-q10").at, 40);
});
