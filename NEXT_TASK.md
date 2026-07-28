# Next atomic task

Shimon asked to publish `@matrix-ai/ui` to npm. Two real packaging bugs were found
and fixed while preparing (`package.json`'s `dependencies`/`devDependencies` split,
and the `"files"` field shipping the entire demo app inside the tarball — see
`ROADMAP.md`/`CHANGELOG.md` for full evidence). **The actual publish was not
attempted and is blocked on two things only Shimon can resolve:**

1. **npm auth.** This machine has no npm login configured (`npm whoami` →
   `ENEEDAUTH`). Run `npm login` (or `npm adduser`) yourself — entering
   credentials/OTP on your behalf isn't something an agent should do.
2. **Which npm scope/account to publish under.** `package.json`'s name is
   `@matrix-ai/ui`. Confirmed via a read-only `npm view` that the exact name is
   unclaimed on the registry, but publishing under the `@matrix-ai` *scope*
   specifically requires you to already own that npm org/username. Options:
   - If you already own (or want to create) an npm org called `matrix-ai`: no
     rename needed.
   - If not, rename the package to a scope you do own — e.g. `@reshimu/matrix-ai-ui`
     (matching this repo's GitHub org), or your personal npm username.
   - Or drop the scope entirely and publish unscoped as some available name (e.g.
     `matrix-ai-ui`) — simplest path, no org needed.

## Once both are resolved

`package.json` still has `"private": true` — this needs to flip to `false` (or be
removed) before `npm publish` will do anything. Left untouched deliberately, since
flipping the switch that makes a publish *possible* before the scope question is
settled would be presumptuous. Once you've decided:

```bash
npm login
# then, after confirming the package name/scope in package.json is what you want:
pnpm build:library
npm publish --access public
```

(`--access public` is required for a *scoped* package's first publish, since npm
defaults new scoped packages to restricted/private access, which requires a paid
plan. Not needed if you go unscoped.)

## Everything else is done

Every item in `RISK_PERFORMANCE_AUDIT.md`'s risk register (R-001–R-009) is resolved
or an explicitly-accepted Low/Informational item. All release gates are checked. The
package is genuinely publish-ready pending the two decisions above — this isn't a
"more work needed" blocker, just decisions only you can make.
