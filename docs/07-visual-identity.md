# Visual Identity — Collegiate Midnight

> This is a design pass, not a Supabase migration phase. The number 07 is kept
> to match the design handout and existing docs links. This revision supersedes
> the earlier kiosk/badge pass (warm paper + signal green); it does not change
> any data or auth logic.

## Direction

QR-ATT should feel like a piece of campus life: a midnight-navy cover, warm
parchment pages, and a restrained gold rule. The reference is a college
publication or event programme, not a generic SaaS dashboard.

| Earlier kiosk pass | Current collegiate pass |
|---|---|
| Warm paper + signal green | Parchment + midnight navy + gold |
| Flat fills, no shadows | Cream cards with soft, low shadows |
| 10px badge corners | 8–24px editorial corners |
| Sans headings | Georgia/serif display headings |
| Green primary action | Navy primary action, gold highlight |
| Kiosk/badge metaphor | Campus publication metaphor |

## Palette

| Token | Value | Use |
|---|---|---|
| `primary` | `#14213D` | Navy — structure, primary actions, headings |
| `primaryDark` | `#0B1528` | Deeper navy for camera chrome |
| `accent` | `#C9A227` | Gold — rules, highlights, scanner frame |
| `accentSoft` | `#F4E9C8` | Gold-tinted icon wells |
| `background` | `#F5F2EA` | Parchment page |
| `card` | `#FFFFFF` | Primary card fill |
| `cardAlt` | `#FBF9F4` | Warm alternate fill |
| `surface` | `#ECE7DC` | Recessed panels |
| `surfaceAlt` | `#F2EEE6` | Secondary surface |
| `border` | `#DDD6C7` | Hairline borders |
| `textPrimary` | `#14213D` | Ink |
| `textSecondary` | `#5C6472` | Support text |
| `textMuted` | `#8A8F98` | Metadata |
| `textOnPrimary` | `#FFFFFF` | Text on navy |
| `textOnAccent` | `#14213D` | Text on gold |
| `success` / `successText` | `#2F6B4F` | Verified check-in |
| `successSoft` | `#E4F0E8` | Success background |
| `danger` / `dangerText` | `#A23B3B` | Errors |
| `dangerSoft` | `#F7E7E7` | Error background |
| `warning` | `#B07A26` | Pending / in progress |
| `warningText` | `#8A5A1F` | Warning text |
| `warningSoft` | `#F7EEDC` | Warning background |

All previous key names are preserved (`successText`, `dangerText`,
`warningText`, `textOnPrimary`, `shadow`, `overlay`, and so on), so existing
screens and the scanner do not need parallel color objects.

### Contrast rules

- White text is used on navy and on `primaryDark`.
- Gold is a highlight, not body text. Gold buttons use navy text.
- Red/green/amber text always uses the `*Text` token on its soft background.
- Muted text is reserved for metadata, never for the only copy in an action.

## Typography

Display text is Georgia on iOS/web and `serif` on Android. Body text uses the
platform sans (no explicit family), so the interface stays readable at small
sizes.

| Token | Size / line | Use |
|---|---|---|
| `TYPE.display` | 34 / 40 serif, 700 | Auth title, page hero |
| `TYPE.h1` | 28 / 34 serif, 700 | Page titles |
| `TYPE.h2` | 20 / 26 sans, 700 | Card titles |
| `TYPE.h3` | 16 / 22 sans, 600 | Row titles, sheet headings |
| `TYPE.body` | 15 / 22 sans | Default copy |
| `TYPE.small` | 13 / 18 sans | Helper text, badges |
| `TYPE.caption` | 11 / 14 sans, 600, 1.2 tracking, uppercase | Eyebrows, labels |
| `TYPE.number` | 32 / 36 serif, 700 | Stats, date blocks |

Rules:

- Serif is for display and numerals only; never for dense body copy.
- Eyebrows and form labels are uppercase with tracking.
- Long names and emails wrap; IDs are truncated from the middle.

## Layout tokens

`constants/theme.ts` is the single source for layout:

- `SPACING`: 4, 8, 12, 16, 20, 24, 32, 40 (`xs`–`huge`).
- `RADIUS`: 8 (`sm`), 12 (`md`), 16 (`lg`), 24 (`xl`), 999 (`pill`).
- `SHADOWS.card`: soft 16px blur, 6% navy, elevation 2.
- `SHADOWS.hero`: 24px blur, 14% navy, elevation 6.
- `Screen` caps content at 720px; `AuthScreen` caps the auth block at 460px.

Cards use a hairline `border` plus `SHADOWS.card`. Navy and scanner surfaces use
`SHADOWS.hero` only when they need to lift off the page.

## Shared primitives

| Primitive | Role |
|---|---|
| `Screen` | Parchment page, safe-area top, 720px max width, scroll or fixed |
| `PageHeader` | Uppercase eyebrow + serif title + support copy |
| `Card` | `default`, `navy`, and `soft` surfaces |
| `Badge` | Gold, green, red, neutral, and light status pills |
| `SectionLabel` | Small gold rule + uppercase section marker |
| `FormField` | Label, input, hint, and error treatment |
| `InlineMessage` | Success/error banner with icon |
| `EmptyState` | Dashed card with icon, copy, and optional action |
| `Stat` | Label + serif numeral for counts |
| `AppButton` | Primary, secondary, accent, ghost, danger; compact variant |
| `Header` | Brand lockup for navy auth surfaces |

`AppButton` keeps the `theme`, `title`, `icon`, `onPress`, `disabled`, and
`compact` API used by the screens. `Header` is now a brand lockup with a `tone`
prop instead of a screen title.

## Screen composition

### Auth (`login`, `register`)

A full-bleed navy page with the brand lockup, a white card, and the gold rule.
Fields are white on parchment; the primary action is navy. The register screen
adds a borderless role card with gold-tinted selected options. `AuthScreen`
exports `authStyles` so both screens share the card, heading, and footer styles.

### Home

A navy hero carries the date, greeting, and gold “Open scanner” action. Two
white action cards (scan, history) sit below, followed by a “How it works”
section with gold step numerals.

### History

The same screen serves both roles. Students see date blocks, event titles, and
event codes; teachers see event cards with a count badge and an attendee roster
with initials, names, and scan times. Unknown names fall back to a short id and
a neutral “S” avatar.

### Profile

A navy identity card holds the avatar, name, role badge, and email. Details and
session controls live in white and soft cards below. Name editing happens in
place; sign-out is the only danger action.

### Teacher

The event studio form uses card sections for details and schedule. The QR card
gets a gold top rule, a centered QR code on a white panel, and a code chip. The
create action is navy; success/error feedback uses `InlineMessage`.

### Scan

The camera is full-bleed in the screen area. Navy scrim controls sit at the top,
the frame corners are gold, and a white bottom sheet reports “Ready to scan”,
“Recording attendance”, success, or failure. The sheet includes scan-again and
pause actions; permission and paused states fall back to parchment cards.

### Tab bar

White with a hairline top border, navy active tint, muted inactive tint,
uppercase-weight labels, and outline/filled Ionicons. The Android scene
background is parchment so tab transitions do not flash white.

## Files changed

| File | Change |
|---|---|
| `constants/theme.ts` | New type, spacing, radius, and shadow tokens |
| `constants/colors.ts` | Collegiate palette; legacy keys preserved |
| `components/Screen.tsx`, `PageHeader.tsx`, `Card.tsx`, `Badge.tsx`, `SectionLabel.tsx`, `FormField.tsx`, `InlineMessage.tsx`, `EmptyState.tsx`, `Stat.tsx` | New shared primitives |
| `components/AppButton.tsx` | Variant-based button system |
| `components/Header.tsx` | Brand lockup with `tone` |
| `components/AuthScreen.tsx` | Navy auth shell and shared `authStyles` |
| `app/login.tsx`, `app/register.tsx` | Auth screens rebuilt on the new system |
| `app/(tabs)/index.tsx` | Collegiate home dashboard |
| `app/(tabs)/history.tsx` | Role-aware history and rosters |
| `app/(tabs)/profile.tsx` | Identity card, details, session |
| `app/(tabs)/teacher.tsx` | Event studio and gold-topped QR card |
| `app/(tabs)/scan.tsx` | Camera overlay and status sheet |
| `app/(tabs)/_layout.tsx` | Navy/parchment tab bar |

## Verification

1. `npm run typecheck` — passes with the new primitives and all screens.
2. `npx expo-doctor` — 18/18 checks passed.
3. `npx expo export --platform web` — bundles and static-renders all routes.
4. Visual checklist on a device/emulator:
   - Auth opens navy with a light brand and white card.
   - Home hero is navy, the scanner action is gold, and both action cards
     navigate.
   - History shows student records or teacher rosters according to role.
   - Profile name editing and sign-out still work.
   - Teacher gate still blocks students; QR creation still requires a cloud
     save.
   - Scanner asks for permission, scans once per check-in, reports success or
     failure, and pauses cleanly.
   - Tab bar active tint is navy; no white flash between tabs.

## History note

The original `docs/07-visual-identity.md` described the kiosk/badge pass (warm
paper, signal green, flat 10px cards). That pass is superseded by this
collegiate system; the kiosk entry remains in `docs/migration-log.md` as
historical context. The visual layer changed only — Supabase schema, auth,
queries, QR format, and RLS are untouched.
