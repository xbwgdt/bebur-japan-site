# Sanity to Cloudflare Pages publishing runbook

## Scope and approval boundary

This repository is ready for a later, user-approved connection to GitHub, Cloudflare Pages, and Sanity. Nothing in this document creates a repository, connects an account, adds an environment variable, creates a deploy hook or webhook, invites a person, or deploys the site. Obtain approval at action time before performing any of those actions.

The publishing path is:

`Sanity publish` -> `Sanity webhook` -> `Cloudflare Pages deploy hook` -> `Git-connected Pages build` -> `out` published to production.

Pages Direct Upload cannot build from Sanity: it only accepts an already-built `out` directory and does not run this project's build command. Use a Git-connected Pages project before enabling automatic publishing from Sanity. Cloudflare documents that a Git-integrated Pages project cannot later be switched to Direct Upload, so make this choice deliberately.

## One-time connection checklist

Perform these steps only after the owner approves them.

1. Create or select the Bebur-owned GitHub repository named `bebur-japan-site`, push the reviewed branch, and identify its production branch (normally `main`). Keep pull requests inside that repository so Pages can provide preview deployments.
2. In Cloudflare, open **Workers & Pages** and create a **Pages** project with **Connect to Git**. Authorize only the GitHub account or organization that owns `bebur-japan-site`, select that repository, and select the production branch.
3. In the project build settings, set the root directory to the repository root, the build command to `npm ci && npm run build && npm run audit:static`, and the build output directory to `out`. `wrangler.jsonc` also records `./out` for local/manual Wrangler commands.
4. In Pages production and preview environment variables, set `NODE_VERSION=22` and copy the three public values from `.env.example`:

   - `NEXT_PUBLIC_SANITY_PROJECT_ID`: the approved Sanity project ID
   - `NEXT_PUBLIC_SANITY_DATASET`: `production` unless the approved dataset differs
   - `NEXT_PUBLIC_SANITY_API_VERSION`: `2025-02-19` unless a reviewed code change updates it

   These `NEXT_PUBLIC_` values are exposed in the static site and are not secrets. Do not put tokens, deploy-hook URLs, or private credentials in `.env.example`, Git, or client-exposed variables. The configured Sanity dataset must permit the anonymous read access used by the build; a private-dataset design needs a separate reviewed server-side credential change.
   When separately hosting the Sanity Studio, set its public build variables to the same values: `SANITY_STUDIO_PROJECT_ID`, `SANITY_STUDIO_DATASET`, and `SANITY_STUDIO_API_VERSION`. They configure the Studio only and must not be substituted for the site's `NEXT_PUBLIC_` variables.
5. Save the Pages configuration and allow the initial Git-connected build to finish. The build log must show the configured command and the static audit must pass before a custom domain is attached or CMS publishing is enabled.

Cloudflare's Git connection creates builds for repository pushes and provides branch/PR previews. Use the production-branch setting rather than relying on the branch initially selected by the provider.

## Connect the CMS rebuild trigger

After the Git-connected Pages build is working:

1. In the Pages project, open **Settings > Builds** and choose **Add deploy hook**. Name it `sanity-production-publish` and choose the same production branch configured above. Copy the generated hook URL to a password manager or the Sanity webhook form only.
2. In the Sanity project settings, open **API > Webhooks** and add a webhook named `cloudflare-pages-production`. Set its URL to the Pages deploy-hook URL, its dataset to `production`, and its method to `POST`.
3. Trigger only published content changes: leave drafts and versions disabled. Use a narrow filter for the documents that affect the website, for example `_type in ["product", "application", "article", "siteSettings", "page"]`, and select create, update, and delete. Do not send the full document body unless a future receiver needs it; the Pages hook only needs the POST trigger.
4. Publish one non-sensitive test update. Confirm a new Pages build begins with the deploy-hook source, its build succeeds, and the changed page appears on the production URL. Revert the test update if it was not intended to remain public.

The deploy-hook URL acts as a credential: anyone with it can request production builds. Restrict access, rotate it by deleting and recreating the hook if exposed, and never commit it. Sanity webhooks normally ignore drafts, preventing a rebuild for every edit.

## Operators and access

Invite people only after the owner supplies their email addresses and approves the invitation. Give access in the system where the person performs work, not a shared owner account:

- GitHub: repository access appropriate to code review and branch protection.
- Cloudflare: the least Pages/domain role that permits the person's deployment or rollback duties.
- Sanity: an Editor role for normal content work; reserve Administrator for project, webhook, and membership changes.

Record the owner, invited address, role, system, and approval in the team's access record. Remove access when the role ends. Do not transmit deploy-hook URLs in invitations.

## Release checks and rollback

For a code release, merge only after GitHub Actions **Verify** passes. For a CMS release, verify the webhook-triggered Pages build succeeds. In both cases, check the Pages deployment URL and the custom-domain home page, then exercise the required route set (`/`, product detail, application detail, insight, about, and contact) before announcing production success.

If a production deployment is faulty, open the Pages project **Deployments** list, locate the last known-good *production* deployment, use its three-dot menu, and choose **Rollback to this deployment**. Confirm that the custom domain now serves the selected deployment. Preview deployments are not rollback targets. Preserve the failed build log and the relevant Sanity webhook delivery details before investigating.

## Manual fallback

Manual fallback is for an approved incident response, not the normal publishing path. From a clean checkout with Node 22 and the approved environment variables, run:

```powershell
npm ci
npm run test:run
npm run audit:content
npm run build
npm run audit:static
npm exec --yes --package=wrangler@4.115.0 -- wrangler pages deploy out --project-name bebur-japan
```

The final command requires separately approved Cloudflare authentication and creates an external deployment. It does not create automatic Sanity publishing; restore the Git connection and deploy-hook workflow after the incident. If the static audit or any preceding check fails, stop and fix the failure before uploading `out`.

## References

- [Cloudflare Pages Git integration](https://developers.cloudflare.com/pages/configuration/git-integration/)
- [Cloudflare Pages deploy hooks](https://developers.cloudflare.com/pages/configuration/deploy-hooks/)
- [Cloudflare Pages rollbacks](https://developers.cloudflare.com/pages/configuration/rollbacks/)
- [Sanity GROQ-powered webhooks](https://www.sanity.io/docs/content-lake/webhooks)
