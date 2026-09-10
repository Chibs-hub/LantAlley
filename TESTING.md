# Trying Lantern Alley

**https://chibs-hub.github.io/LantAlley/**

That link is the whole thing. No store, no account, no download — it opens in a
browser and it is already the app.

---

## Put it on your phone

It installs from the browser, and afterwards it opens like any other app: its
own icon, no address bar, and it works with no signal.

**Android (Chrome)**
Open the link, then tap **Install app** on the title screen when it appears. If you do
not see it, use the ⋮ menu → *Install app*.

**iPhone (Safari — not Chrome)**
Open the link, tap the Share button, then **Add to Home Screen**. Safari gives
no install button, which is why the game says so on the title screen.

**Computer (Chrome or Edge)**
Open the link and click the install icon at the right of the address bar.

---

## Before you spend time on it: save your progress

Your progress is kept **in that browser on that device, and nowhere else**. It
is not in an account. Clearing your browsing data clears it, and on iPhone the
system has been known to clear an unused web app's data on its own.

So if you play for more than a few minutes, open **Menu → Save data** on the
title screen and press **Export save**. That gives you a small file. **Import
save** puts it back — on the same device or a different one.

Worth doing before you switch phones, clear anything, or leave it a few weeks.

---

## What to try

### Debug Mode (local build 326)

On the opening screen choose **Menu > Debug Mode: Off** to turn it on. The page
reloads at the opening; character selection and the Entrance still play normally.
The DEBUG MODE banner confirms that the separate test save is active.

All catalog furniture, wallpaper, the cat, and planted and fully grown versions
of every garden species are in storage. Items without finished art retain their
existing placeholder drawings. Skip question and Skip stage appear in Inn
training; episode questions also have Skip question. These are testing shortcuts,
not evidence of learning. Debug play does not send analytics.

**Exit debug** returns to the normal save. Re-entering Debug Mode resumes its
own save and placements. **Menu > Start over** while in Debug Mode resets only
the test save and restocks its inventory. A debug export cannot be imported into
normal play. For release, set `available = false` in `debug-mode.js`, then bump
the cache/version stamps; this hides the new mode and ignores `?debug=1`.

The standalone cold-start task has been removed: the first Inn task is now
Day 1 question 1, with its word card and help. There is no immediate replay
behind a second introduction screen.

You do not need to know any Japanese to start. The first stage teaches five
words and tells you which five before it begins.

1. Walk through the entrance, then go to **月見宿** (the inn) on the map.
2. Play the three days. They get harder on purpose: day one shows you
   everything, day two takes the romaji away, day three gives you only audio.
3. Finish the shift and the episode after it.

**Turn the sound on.** Every Japanese line is spoken, and the third day cannot
be played without it.

---

## Updates, and which version you are on

Open **Menu** on the title screen to see the build shown in your copy.
**Please include that exact displayed build when you report anything** — an
installed copy runs the version already on your phone, so you can be a launch
behind whatever was fixed most recently.

When a new build is ready you will see **A new version is available.** with an
**Update now** button. Pressing it reloads into the new version; **Later**
keeps you where you are. Your progress is not affected either way.

Nothing needs reinstalling, ever. Updates arrive on their own.

---

## Telling us what happened

The useful thing is not "it was good" — it is where you got stuck, bored, or
confused. Especially:

- A question you could not answer because you did not understand **what it was
  asking**, as opposed to not knowing the word.
- A moment you wanted to stop.
- Anything that looked broken, cut off, or overlapping — **a screenshot with
  the whole window in it** helps more than a cropped one.
- Japanese that sounds wrong, unnatural, or like something nobody would say.
  This one matters most, and native speakers should be blunt about it.

---

## Known, already

- **引き受ける** appears in Day 1 as a yes/no question, so that one can be
  guessed. It is asked properly on day three.
- The reading aid leaves a few words unglossed on purpose, where the same kanji
  has more than one reading and guessing would teach the wrong one.
- Some words in the episode are introduced there rather than taught in the
  three days. The episode names them before it starts.
