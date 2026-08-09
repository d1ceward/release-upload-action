import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

// Local imports
import { callArgs, setupRun } from './helpers.ts'

describe('run', () => {
  it('creates a draft release for the pushed tag', async () => {
    const { run, harness } = await setupRun({
      ref: 'refs/tags/v1.2.3',
      sha: 'abc123',
      repo: { owner: 'd1ceward', repo: 'release-upload-action' }
    })

    await run()

    assert.equal(harness.core.setFailed.mock.callCount(), 0)
    assert.equal(harness.octokit.createRelease.mock.callCount(), 1)
    assert.deepEqual(callArgs(harness.octokit.createRelease)[0], {
      draft: true,
      owner: 'd1ceward',
      repo: 'release-upload-action',
      tag_name: 'v1.2.3',
      target_commitish: 'abc123'
    })
  })

  it('authenticates with the token input', async () => {
    const { run, harness } = await setupRun({ token: 'ghs_token' })

    await run()

    assert.deepEqual(callArgs(harness.octokit.getOctokit), ['ghs_token'])
  })

  it('uploads every requested file under its base name', async () => {
    const { run, harness } = await setupRun({
      files: ['bin/release-linux', 'bin/release-windows.exe'],
      releaseId: 99,
      fileContents: { 'bin/release-linux': Buffer.from('linux-binary') }
    })

    await run()

    const uploads = harness.octokit.uploadReleaseAsset.mock.calls.map(
      call => call.arguments[0] as { name: string; data: Buffer; release_id: number }
    )
    assert.equal(uploads.length, 2)
    assert.deepEqual(
      uploads.map(upload => upload.name),
      ['release-linux', 'release-windows.exe']
    )
    assert.equal(uploads[0].release_id, 99)
    assert.deepEqual(uploads[0].data, Buffer.from('linux-binary'))
    assert.deepEqual(
      harness.readFile.mock.calls.map(call => call.arguments[0]),
      ['bin/release-linux', 'bin/release-windows.exe']
    )
  })

  it('logs the permalink of each uploaded asset', async () => {
    const { run, harness } = await setupRun({ files: ['dist/app.zip'] })

    await run()

    assert.deepEqual(callArgs(harness.core.info), [
      'Uploaded file app.zip, permalink is: https://example.test/app.zip'
    ])
  })

  it('skips creating a release when the tag already has one', async () => {
    const { run, harness } = await setupRun({
      ref: 'refs/tags/v1.2.3',
      existingTags: ['v1.0.0', 'v1.2.3']
    })

    await run()

    assert.equal(harness.octokit.createRelease.mock.callCount(), 0)
    assert.equal(harness.octokit.uploadReleaseAsset.mock.callCount(), 0)
    assert.deepEqual(callArgs(harness.core.warning), ['Release with tag v1.2.3 already exists'])
    assert.equal(harness.core.setFailed.mock.callCount(), 0)
  })

  it('still creates a release when other tags exist', async () => {
    const { run, harness } = await setupRun({
      ref: 'refs/tags/v2.0.0',
      existingTags: ['v1.0.0', 'v1.2.3']
    })

    await run()

    assert.equal(harness.core.warning.mock.callCount(), 0)
    assert.equal(harness.octokit.createRelease.mock.callCount(), 1)
  })

  it('fails when the ref is not a tag', async () => {
    const { run, harness } = await setupRun({ ref: 'refs/heads/develop' })

    await run()

    assert.deepEqual(callArgs(harness.core.setFailed), ['No release tag found'])
    assert.equal(harness.octokit.listReleases.mock.callCount(), 0)
    assert.equal(harness.octokit.createRelease.mock.callCount(), 0)
  })

  it('fails when a file cannot be read', async () => {
    const { run, harness } = await setupRun({
      readFileError: new Error('ENOENT: no such file or directory')
    })

    await run()

    assert.deepEqual(callArgs(harness.core.setFailed), ['ENOENT: no such file or directory'])
    assert.equal(harness.octokit.uploadReleaseAsset.mock.callCount(), 0)
  })

  it('fails with a generic message when a non-Error is thrown', async () => {
    const { run, harness } = await setupRun()
    harness.octokit.listReleases.mock.mockImplementation(async () => {
      throw 'boom'
    })

    await run()

    assert.deepEqual(callArgs(harness.core.setFailed), ['Unknown error'])
  })

  it('reports the API failure message when the release cannot be created', async () => {
    const { run, harness } = await setupRun()
    harness.octokit.createRelease.mock.mockImplementation(async () => {
      throw new Error('Validation Failed')
    })

    await run()

    assert.deepEqual(callArgs(harness.core.setFailed), ['Validation Failed'])
  })
})
