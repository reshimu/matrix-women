# Next atomic task

The package has been renamed to `@reshimu/matrix-ai-ui` (Shimon's explicit choice,
matching this repo's GitHub org `reshimu`) and is fully publish-ready. **The only
remaining blocker is npm auth, which only Shimon can resolve:**

This machine has no npm login configured (`npm whoami` → `ENEEDAUTH`). Run
`npm login` (or `npm adduser`) yourself — entering credentials/OTP on your behalf
isn't something an agent should do.

## Once you're logged in

`package.json` still has `"private": true` — this needs to flip to `false` (or be
removed) before `npm publish` will do anything. Left untouched deliberately, since
flipping the switch that makes a publish *possible* before you've actually logged in
would be presumptuous. Once you've logged in:

```bash
npm login
# then, after flipping "private": true -> false (or removing the field) in package.json:
pnpm build:library
npm publish --access public
```

(`--access public` is required for a scoped package's first publish, since npm
defaults new scoped packages to restricted/private access, which requires a paid
plan.)

## Everything else is done

Every item in `RISK_PERFORMANCE_AUDIT.md`'s risk register (R-001–R-009) is resolved
or an explicitly-accepted Low/Informational item. All release gates are checked. The
package is genuinely publish-ready pending the login step above — this isn't a
"more work needed" blocker, just an action only you can take.
