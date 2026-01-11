# Windsurf Initialization Prompt

Copy and paste the following prompt into Windsurf to begin the project:

---

## Prompt

```
I'm building a Design System Extractor — a tool that analyzes websites and extracts their design tokens (colors, typography, spacing) into a type-safe TypeScript package.

Before we start implementing, I need you to:

1. **Read and understand the project structure**:
   - Read `ROADMAP.md` — this is your step-by-step implementation guide
   - Read `.windsurf/rules/architecture.md` — core values and patterns
   - Read `.windsurf/rules/testing.md` — testing philosophy
   - Read `.windsurf/rules/ci-cd.md` — CI/CD and commit conventions

2. **Review and critique the roadmap**:
   - Are the CLs (changelists) appropriately sized?
   - Are there any missing steps?
   - Are there potential issues or edge cases not addressed?
   - Do you have suggestions for improvements?

3. **Ask clarifying questions** if anything is unclear.

4. **Summarize your understanding** of:
   - The core values (especially: primitives are style-locked, types define contract)
   - The checkpointing system for extraction progress
   - The 95% match threshold for automated comparison

Once you've reviewed everything and I've answered any questions, we'll start with Phase 0: Repository Setup.

Important notes:
- Use npm (not pnpm or yarn)
- Commit messages should be simple and descriptive WITHOUT type prefixes (e.g., "Add Button component" not "feat(primitives): add button")
- Check off tasks in ROADMAP.md as you complete them
- Stop at each 🛑 CHECKPOINT and verify everything works
- If something seems wrong or could be improved, tell me before proceeding

Let's begin by having you read the files and share your review.
```

---

## What to Expect

After pasting this prompt, Windsurf should:

1. Read the ROADMAP.md file
2. Read the architecture, testing, and CI/CD rules
3. Provide a summary of its understanding
4. Ask any clarifying questions
5. Suggest improvements to the roadmap
6. Wait for your confirmation before starting

## If Windsurf Doesn't Read Files

If Windsurf doesn't automatically read the files, explicitly ask:

```
Please read the following files and summarize your understanding:
1. ROADMAP.md
2. .windsurf/rules/architecture.md
3. .windsurf/rules/testing.md
4. .windsurf/rules/ci-cd.md

Then review and critique the roadmap before we start implementing.
```

## Starting Implementation

Once Windsurf has reviewed everything and you're ready to start:

```
Let's begin with CL-0.1: Create GitHub Repository.
My GitHub username is Eyobdd.
Walk me through the steps and then we'll continue to CL-0.2.
```

## Handling Issues

If Windsurf makes a mistake or deviates from the plan:

```
Stop. That's not what we discussed. Please re-read [specific file] and explain:
1. What the file says we should do
2. What you did instead
3. How you'll fix it
```

## Ending a Session

When you need to stop for the day:

```
Let's stop here for now. Please:
1. Summarize what we completed
2. List any uncommitted changes
3. Note where we should pick up next time (which CL)
4. Flag any concerns or blockers
```

## Resuming a Session

When you come back:

```
We're continuing work on the Design System Extractor.
Last time we completed [CL-X.X].
Please read ROADMAP.md and confirm the next step is [CL-X.X].
Let's continue.
```
