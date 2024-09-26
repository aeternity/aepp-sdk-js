# Releases

This document describes the requirements and the process of creating releases of
aepp-sdk to npmjs.com.

## Prerequisites

A user wanting to release a new version needs to be a member of the `@aeternity`
organization on npmjs.com. An existing member with write access needs to invite
them in order to achieve this. In addition, the user needs to activate any means
of 2-factor authentication because the `aepp-sdk` package is set up to only
accept new versions if a second factor for authentication is in use.

As new releases should only happen from release branch merges to the `master`
branch of the repository on GitHub followed by a signed tag push, the user also
needs direct write access to [the repository] on GitHub. Normally, this can be
achieved by first adding them to the [æternity organization] and then to the
[sdk team], which gives automatic _write_ access.

[the repository]: https://github.com/aeternity/aepp-sdk-js
[æternity organization]: https://github.com/orgs/aeternity/people
[sdk team]: https://github.com/orgs/aeternity/teams/sdk

## Branching Out

As aepp-sdk follows the [git-flow strategy] for development, the release process
is modelled after that strategy accordingly, with a few additions.

Branch out from `develop` to a dedicated release branch denoting the target
version number, e.g. `release/v2.3.4`.

[git-flow strategy]: https://danielkummer.github.io/git-flow-cheatsheet/

## Preparing a Pre-Release

If Testnet is not yet targeting the latest Node version, but you're "ready to
release", you can do a pre-release for the latest version, tagging the release
as `@next` on npmjs.

To do this, You can follow the steps listed below, while keeping the `next`
portion in both `CHANGELOG.md` and `package.json` files.

## Preparing a Release

On the release branch, remove the `next` portion of the `version`
string in `package.json`.

Execute `npm run release` to automatically

- bump version number in package.json and package-lock.json (according to
  [Semantic Versioning])
- output changes to [CHANGELOG.md]
- commit package-lock.json and package.json and CHANGELOG.md

Next, `git diff` the release, branch a `release/vX.X.X` (where `vX.X.X` is your
latest release) against `master` and validate that all changes are covered in
the changelog. You can find more instructions on how to maintain a CHANGELOG here:

- [https://keepachangelog.com](https://keepachangelog.com)

[CHANGELOG.md]: ../CHANGELOG.md
[Semantic Versioning]: https://semver.org

## PR against `master`

Create a pull request against `master` and have it peer reviewed thoroughly. As
all changes should've been reviewed before when they were merged to `develop`,
emphasize on security-related changes and small changes pushed to `develop`
separately.

## Merging

Once the integration build has successfully completed (with or without additional
fixes), _merge_ (without squash) the branch into `master`. This allows `master`
to be comprised of release commits exclusively, so every commit on master corresponds
to exactly one released (or at least, tagged) version of aepp-sdk, respectively.

## Build, Release and Tag

Update the local working copy to a local tracking branch of `master` and
update. Optionally, wait for the CI build to finish and execute a last
`npm run test` locally.

Important: Because `npm publish` will use the _local files on disk_ for
releasing, perform a full clean and build in order to release to npmjs.com!

1. Cleanup - run `git clean -ffdx` to completely wipe out your workspace of
   files not in the repository. This might wipe out files you still need, so
   consider a separate clone of the project!
2. Execute `npm run prepublishOnly` to generate Documentation for the API and
   the SDK codebase, optionally followed by `npm pack` and investigate the
   resulting tarball's contents. This tarball resembles what
   users will actually download from npmjs.com once the release is completed!
3. Execute `npm publish` and follow the on-screen instructions

**Important:** If you are releasing a Pre-Release (AKA `next`), make sure to
tag the release as `next` using the command `npm publish --tag next`.

At this point, the release should already be in npmjs.com. The final step is to
also tag the release on GitHub and push the tag, _which requires direct write
access_.

1. `git tag vX.X.X`
2. `git push tag vX.X.X`

> Recommendation: Use signed tags using the -s option to increase community's
> trust in the project!

## Merging Back into `develop`

At this point, it is important to synchronize `develop` with any changes that
have happened after branching out to the release branch. Create a new branch
called `realign/vX.X.X` from `master` (where `vX.X.X` is your latest release)
and open a Pull Request towards `develop` and resolve conflicts, if needed.

This concludes the release process and the development cycle.
