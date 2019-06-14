# Releases

This document describes the requirements and the process of creating releases of
aepp-sdk to npmjs.com.

## Prerequisites

A user wanting to release a new version needs to be a member of the `@aeternity`
organization on npmjs.com. An existing member with write access needs to invite
them in order to achieve this. In addition, the user needs to activate any means
of 2-factor authentication because the `aepp-sdk` package is set up to only
accept new versions if a second factor for authentication is in use.

> This is in light of the latest `eslint-scope` hack.

As new releases should only happen from release branch merges to the `master`
branch of the repository on GitHub followed by a signed tag push, the user also
needs direct write access to [the repository] on GitHub. Normally, this can be
achieved by first adding them to the [æternity organization] and then to the
[sdk team], which gives automatic _write_ access.

[the repository]: https://github.com/aeternity/aepp-sdk-js
[æternity organization]: https://github.com/orgs/aeternity/people
[sdk team]: https://github.com/orgs/aeternity/teams/sdk

## Branching Out

As aepp-sdk follows the [git-flow strategy] for develoment, the release process
is modelled after that strategy accordingly, with a few additions.

Branch out from `develop` to a dedicated release branch denoting the target
version number, e.g. `release/0.20.0-0.1.0` for a hypothetical first release
targeting Node 0.20.0.

[git-flow strategy]: https://danielkummer.github.io/git-flow-cheatsheet/

## Preparing a Pre-Release

If Testnet is not yet targeting the latest Node version, but you're "ready to release", you can do a pre-release for the latest version, tagging the release as `@next` on npmjs.

To do this, You can follow the steps listed below, while keeping the `next` portion in both `CHANGELOG.md` and `package.json` files.

## Preparing a Release

On the release branch, remove the `next` portion of the `version`
string in `package.json`. Replace the `[Unreleased]` header in the
[change log file], if you have that, with the new version string.
Next, `git diff` the release, branch a `release/X.X.X` (where `X.X.X` is your latest release) against `master` and validate that all changes are covered in the changelog. You can find more instructions on how to maintain a CHANGELOG: [here](http://keepachangelog.com).

Also, make sure to add a new link at the bottom of the file that will
provide a diff between the last released version and the to-be released
version.

There's a catch: That link won't be able to work until after the release has
been made!

[change log file]: ../CHANGELOG.md

## PR against `master`

Create a pull request against `master` and have it peer reviewed thoroughly. As
all changes should've been reviewed before when they were merged to `develop`,
emphasize on security-related changes and small changes pushed to `develop`
separately.

## Merging

Once the integration build has succesfully completed (with or without additional
fixes), *merge* (without squash) the branch into `master`. This allows `master` to be comprised of release commits exclusively, so every commit on master correponds to exactly one released (or at least, tagged) version of aepp-sdk, respectively.

## Build, Release and Tag

Update the local working copy to a local tracking branch of `master` and
update. Optionally, wait for the CI build to finish and execute a last
`npm run test` locally.

Important: Because `npm publish` will use the *local files on disk* for
releasing, perform a full clean and build in order to release to npmjs.com!

1. Cleanup - run `git clean -ffdx` to completely wipe out your workspace of
   files not in the repository. This might wipe out files you still need, so
   consider a seperate clone of the project!
2. Execute `npm run prepublishOnly` to generate Documentation for the API and the SDK codebase, optionally followed by `npm pack` and investigate the resulting tarball's contents. This tarball resembles what
   users will actual download from npmjs.com once the release is completed!
3. Execute `npm publish` and follow the on-screen instructions

**Important:** If you are releasing a Pre-Release (AKA `next`), make sure to tag the release as `next` using the command `npm publish --tag next`.

At this point, the release should already be in npmjs.com. The final step is to
also tag the release on GitHub and push the tag, *which requires direct write
access*.

1. `git tag $VERSION`
2. `git push tag $VERSION`

> Recommendation: Use signed tags using the -s option to increase community's
> trust in the project!

## Merging Back into `develop`

At this point, it is important to synchronize `develop` with any changes that
have happened after branching out to the release branch. Create a new branch called `realign/X.X.X` from `master` (where `X.X.X` is your latest release) and open a Pull Request towards `develop` and resolve conflicts, if needed.

This concludes the release process and the development cycle.
