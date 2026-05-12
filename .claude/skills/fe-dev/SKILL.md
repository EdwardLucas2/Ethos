---
name: fe-dev
description: Full-pipeline workflow for implementing a frontend screen — context gathering, planning, implementation, visual conformance loop (screenshots vs wireframe), and Maestro e2e tests.
argument-hint: "[screen-name]"
disable-model-invocation: true
allowed-tools: Bash Agent Read Write Edit
---

# fe-dev

Full-pipeline workflow for implementing a frontend screen: context gathering → planning → implementation → visual conformance loop → e2e tests.

Uses sub-agents to keep orchestrator context lean — images and test output stay inside sub-agents; only text summaries return here.

**Available wireframes:**

```!
ls ../product/MVPScreenDesignsV1_stitch/Pages/ 2>/dev/null || echo "(none found — check product directory)"
```

**Existing auth screens:**

```!
ls app/app/\(auth\)/*.tsx 2>/dev/null | grep -v '_layout' || echo "(none found)"
```

---

## Phase 1 — Gather inputs

Ask the user for:

1. **Screen name** — e.g. `sign-up`, `login` (use `$ARGUMENTS` if provided, confirm with user)
2. **Wireframe path** — default convention is `../product/MVPScreenDesignsV1_stitch/Pages/<PascalCaseScreenName>/screen.png`. Confirm the file exists before proceeding.
3. **PRD** — is there a relevant PRD in `../product/MVPScreenDesignsV1_stitch/PRDs/`? If so, which file.
4. **Steer** — any priorities, constraints, or notes to guide the work.

Do not proceed until you have at least the screen name and a confirmed wireframe path.

---

## Phase 2 — Context gathering (sub-agent)

Spawn a general-purpose sub-agent. Brief:

> Survey the frontend codebase at `app/` (monorepo root) to gather context for building the **<screen name>** screen. Return a structured text summary covering:
>
> 1. Reusable components in `app/components/` that are relevant to this screen — name, file path, one-line description of each
> 2. Design tokens in `app/constants/theme.ts` — list colours, spacing scale, typography fonts, shadow styles, border widths
> 3. Auth API in `app/src/api/auth.ts` — what functions exist, their signatures, what errors they throw
> 4. Any orval-generated hooks in `app/src/api/index.ts` relevant to this screen
> 5. Current state of `app/app/(auth)/<screen>.tsx` if it exists — what is already implemented, what is missing
> 6. The Storybook mock setup in `app/.storybook/mocks/` — what modules are mocked and how
> 7. Code style reference from `app/app/(auth)/login.tsx` — note patterns used (StyleSheet structure, component shape, testID conventions)
> 8. Navigation structure from `app/app/(auth)/_layout.tsx` — how screens are registered in the Expo Router stack (stack config, header options, any screen-specific options)
>
> Be specific and concrete. Do not paste raw file contents — summarise what matters for implementation.

Store the returned summary. You will paste it verbatim into subsequent sub-agent briefs.

---

## Phase 3 — Planning (interactive)

Read the wireframe image. Read the PRD if one was provided.

Present the user with:

- Every element visible in the wireframe (layout, components, interactive states)
- Anything ambiguous or not covered by the wireframe
- Major decisions that need their input
- What already exists vs what needs to be built

Wait for the user to confirm or redirect. Capture all decisions made.

You will not re-read the wireframe after this phase — the visual loop sub-agent handles all future image comparisons.

---

## Phase 4 — Implementation (sub-agent)

Spawn a general-purpose sub-agent with a complete self-contained brief:

> Implement the **<screen name>** screen for the Ethos React Native app.
>
> **Files to create/update:**
>
> - Screen: `app/app/(auth)/<screen>.tsx`
> - Stories: `app/app/(auth)/<screen>.stories.tsx`
>
> **Codebase context:**
> <paste Phase 2 summary verbatim>
>
> **What to build** (from wireframe — be exhaustive):
> <your description of every element and state visible in the wireframe>
>
> **User steer and planning decisions:**
> <everything the user said in Phase 3>
>
> **Requirements:**
>
> - Only use tokens from `app/constants/theme.ts` — no hardcoded colours, fonts, or spacing
> - Use `react-native` core components only — no external UI kit
> - Follow the code style from the reference screen
> - Add `testID` to every interactive element and major container
> - Must compile without TypeScript errors
>
> **Before returning:** run `cd app && npm run typecheck` and fix all type errors. Include the result (clean / errors fixed) in your summary.
>
> **Stories requirements:**
>
> - A `Default` story (idle state, no play function) — used for visual comparison
> - A story with a play function for each interactive state (validation errors, API errors, loading)
> - Follow the pattern in `app/app/(auth)/sign-up.stories.tsx` exactly
> - Mock any new API calls in `app/.storybook/mocks/auth-api.ts` if needed
>
> Return: what was implemented, which files were changed, any trade-offs, anything the visual loop should pay attention to.

Wait for the sub-agent. Store its summary.

---

## Phase 5 — Storybook setup

Run the helper script to ensure Storybook is running:

```bash
bash "${CLAUDE_SKILL_DIR}/scripts/ensure-storybook.sh"
```

The script outputs `already-running`, `started:<pid>`, or exits non-zero with an `error:` message on stderr.

- If the output starts with `started:`, extract the PID — you will need it for cleanup.
- If the script exits with an error, report the message to the user and stop here.

---

## Phase 6 — Visual conformance loop (sub-agent, max 10 passes)

Spawn a general-purpose sub-agent. This sub-agent runs the full loop internally.

> Fix the **<screen name>** screen to visually match its wireframe.
>
> **Wireframe:** `../product/MVPScreenDesignsV1_stitch/Pages/<PascalCaseName>/screen.png`
> **Screen file:** `app/app/(auth)/<screen>.tsx`
> **Stories file:** `app/app/(auth)/<screen>.stories.tsx`
> **Screenshots directory:** `app/storybook-screenshots/`
> **Design tokens:** `app/constants/theme.ts`
> **Storybook is already running on localhost:6006.**
>
> **Implementation summary:**
> <paste Phase 4 summary verbatim>
>
> **Loop — up to 10 passes:**
>
> Each pass:
>
> 1. Run the test runner from `app/`:
>     ```bash
>     cd app && npm run test-storybook
>     ```
> 2. Read the wireframe PNG.
> 3. Read the Default story screenshot. The filename follows the pattern `app/storybook-screenshots/screens-<screen>--default.png`, where `<screen>` is the kebab-case screen name (e.g. `sign-up`, `login`) matching the story title prefix. Also read any other story screenshots relevant to checking visual states.
> 4. Compare screenshot to wireframe. List every discrepancy: missing elements, wrong colour, wrong layout, wrong font weight, wrong spacing, wrong border style.
> 5. No significant discrepancies → return: `DONE after N passes.`
> 6. Discrepancies found → fix them in the screen file, then proceed to next pass.
> 7. After pass 10 → return: `LIMIT REACHED after 10 passes. Remaining issues: <specific list>.`
>
> Focus on changing the visual presentation. You may edit the screen file and the stories file. Do not touch Maestro test files (`app/.maestro/`).

If the sub-agent returns `LIMIT REACHED`, report the issues to the user and stop here.

---

## Phase 7 — Maestro e2e loop (sub-agent, max 3 passes)

Before spawning, check whether `app/.maestro/<screen>.yaml` exists. If it does not, note this in the sub-agent brief and instruct it to create the file first using the `testID` values from the Phase 4 summary.

Spawn a general-purpose sub-agent:

> Run and fix the Maestro e2e tests for the **<screen name>** screen.
>
> **Test file:** `app/.maestro/<screen>.yaml`
> **Screen file:** `app/app/(auth)/<screen>.tsx`
> **Maestro binary:** `~/.maestro/bin/maestro`
>
> **Implementation summary:**
> <paste Phase 4 summary verbatim>
>
> **If the test file does not exist:** create `app/.maestro/<screen>.yaml` covering the main user flows using the `testID` values listed in the implementation summary. Then proceed with the loop.
>
> **Loop — up to 3 passes:**
>
> Each pass:
>
> 1. Run the tests:
>     ```bash
>     ~/.maestro/bin/maestro test app/.maestro/<screen>.yaml
>     ```
> 2. All pass → return: `PASS after N passes.`
> 3. Failures → analyse output, fix the root cause in the screen or test file, proceed to next pass.
> 4. After pass 3 → return: `LIMIT REACHED after 3 passes. Failing: <test names>. Root cause: <diagnosis>. Suggested next step: <what to do>.`
>
> Do not rewrite test assertions to paper over app bugs — fix the app.

---

## Phase 8 — Cleanup and report

If you started Storybook in Phase 5 (output was `started:<pid>`), stop it:

```bash
kill <pid> 2>/dev/null || true
```

Report to the user:

- **Visual conformance:** done after N passes / limit reached with these issues
- **E2e tests:** passing / limit reached with these issues
- **Files changed:** list
- **Anything outstanding** that needs manual attention
